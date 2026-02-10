import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Response } from 'express';

import type { RequestWithContext } from '../interfaces/request-with-context.interface';

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown;
    timestamp: string;
    requestId: string;
  };
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();

    const timestamp = new Date().toISOString();
    const requestId = request.requestId ?? 'unknown';

    const normalized = this.normalizeException(exception);

    const body: ApiErrorBody = {
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
        timestamp,
        requestId
      }
    };

    if (normalized.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${normalized.code}: ${normalized.message}`,
        normalized.stack,
        JSON.stringify({ requestId, path: request.originalUrl })
      );
    }

    response.status(normalized.status).json(body);
  }

  private normalizeException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details: unknown;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const payload = typeof response === 'string' ? { message: response } : (response as Record<string, unknown>);
      const message = this.extractMessage(payload);

      return {
        status,
        code: this.httpCodeFromStatus(status),
        message,
        details: payload,
        stack: exception.stack
      };
    }

    if (this.isPrismaKnownRequestError(exception)) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'A unique constraint was violated.',
          details: exception.meta,
          stack: exception.stack
        };
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Requested record was not found.',
          details: exception.meta,
          stack: exception.stack
        };
      }
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong.',
        details: undefined,
        stack: exception.stack
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong.',
      details: undefined
    };
  }

  private extractMessage(payload: Record<string, unknown>): string {
    const rawMessage = payload.message;
    if (Array.isArray(rawMessage)) {
      return rawMessage.join(', ');
    }

    if (typeof rawMessage === 'string') {
      return rawMessage;
    }

    return 'Request failed.';
  }

  private httpCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR';
    }
  }

  private isPrismaKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        'clientVersion' in error &&
        'meta' in error
    );
  }
}
