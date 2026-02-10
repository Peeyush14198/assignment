import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { ActionLog, Case, Customer, Loan } from '@prisma/client';
import { statSync } from 'fs';
import dayjs from 'dayjs';
import puppeteer, { type Browser } from 'puppeteer-core';

interface NoticeRenderInput {
  caseRecord: Case;
  customer: Customer;
  loan: Loan;
  actions: ActionLog[];
}

@Injectable()
export class NoticeService {
  async generatePaymentReminderPdf(input: NoticeRenderInput): Promise<Buffer> {
    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      const html = this.buildHtml(input);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '14mm',
          bottom: '20mm',
          left: '14mm'
        }
      });

      return Buffer.from(pdfBytes);
    } finally {
      await browser.close();
    }
  }

  private async launchBrowser(): Promise<Browser> {
    const executablePath = this.resolveChromiumPath();

    try {
      return await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch {
      throw new ServiceUnavailableException(
        'PDF service is unavailable. Ensure Chromium is installed and PUPPETEER_EXECUTABLE_PATH is configured.'
      );
    }
  }

  private resolveChromiumPath(): string | undefined {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const knownCandidates = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
    return knownCandidates.find((candidate) => {
      try {
        return Boolean(statSync(candidate));
      } catch {
        return false;
      }
    });
  }

  private buildHtml(input: NoticeRenderInput): string {
    const payBeforeDate = dayjs().add(3, 'day').format('YYYY-MM-DD');
    const generatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss [UTC]');
    const actions = input.actions.slice(0, 3);

    const actionRows =
      actions.length > 0
        ? actions
            .map(
              (action) => `
              <tr>
                <td>${this.escape(action.type)}</td>
                <td>${this.escape(action.outcome)}</td>
                <td>${this.escape(action.notes ?? '-')}</td>
                <td>${dayjs(action.createdAt).format('YYYY-MM-DD HH:mm')}</td>
              </tr>
            `
            )
            .join('')
        : `
          <tr>
            <td colspan="4">No actions recorded yet.</td>
          </tr>
        `;

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Payment Reminder - Case #${input.caseRecord.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1f2937;
              font-size: 12px;
              line-height: 1.45;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #1f4c7c;
              padding-bottom: 10px;
              margin-bottom: 16px;
            }
            .logo {
              width: 120px;
              height: 36px;
              border: 1px dashed #64748b;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #64748b;
              font-size: 11px;
            }
            h1 {
              margin: 0;
              font-size: 20px;
            }
            .section {
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 10px 12px;
              margin-bottom: 12px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 16px;
            }
            .label {
              font-weight: 600;
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th,
            td {
              border: 1px solid #d1d5db;
              padding: 6px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f8fafc;
              font-weight: 700;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 10px;
              border-radius: 6px;
              margin-top: 10px;
            }
            footer {
              margin-top: 20px;
              color: #6b7280;
              font-size: 10px;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <header class="header">
            <div>
              <h1>Payment Reminder Notice</h1>
              <div>Case #${input.caseRecord.id}</div>
            </div>
            <div class="logo">LOGO</div>
          </header>

          <section class="section">
            <div class="grid">
              <div><span class="label">Customer:</span> ${this.escape(input.customer.name)}</div>
              <div><span class="label">Phone:</span> ${this.escape(input.customer.phone)}</div>
              <div><span class="label">Email:</span> ${this.escape(input.customer.email)}</div>
              <div><span class="label">Country:</span> ${this.escape(input.customer.country)}</div>
            </div>
          </section>

          <section class="section">
            <div class="grid">
              <div><span class="label">Loan ID:</span> ${input.loan.id}</div>
              <div><span class="label">Loan Status:</span> ${this.escape(input.loan.status)}</div>
              <div><span class="label">Principal:</span> ${this.formatAmount(input.loan.principal)}</div>
              <div><span class="label">Outstanding:</span> ${this.formatAmount(input.loan.outstanding)}</div>
              <div><span class="label">Due Date:</span> ${dayjs(input.loan.dueDate).format('YYYY-MM-DD')}</div>
              <div><span class="label">DPD:</span> ${input.caseRecord.dpd}</div>
              <div><span class="label">Stage:</span> ${this.escape(input.caseRecord.stage)}</div>
              <div><span class="label">Assigned Agent:</span> ${this.escape(input.caseRecord.assignedTo ?? 'Unassigned')}</div>
            </div>
          </section>

          <section class="section">
            <div class="label" style="margin-bottom: 6px;">Last 3 Actions</div>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${actionRows}
              </tbody>
            </table>
          </section>

          <div class="warning">
            Please clear your outstanding dues by <strong>${payBeforeDate}</strong> to avoid escalation.
          </div>

          <footer>
            Generated at ${generatedAt}. This is a system-generated reminder.
          </footer>
        </body>
      </html>
    `;
  }

  private formatAmount(value: unknown): string {
    const numericValue = Number(value);
    return Number.isFinite(numericValue)
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue)
      : '$0.00';
  }

  private escape(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
