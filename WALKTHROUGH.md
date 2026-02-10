# Collection Case Manager - Project Walkthrough

## Overview
This project is a full-stack web application designed for loan collection operations. It allows agents to manage delinquency cases, log actions, and automate assignments based on configurable rules.

## Architecture

### Backend (NestJS)
The backend is built with **NestJS**, following a modular architecture:
-   **Modules**: `CasesModule`, `RulesModule`, `NoticeModule` (PDF generation).
-   **Database**: **PostgreSQL** accessed via **Prisma ORM** (serving as the Data Access/Repository layer).
-   **Services**:
    -   `CasesService`: Core business logic for creating cases, managing state, and handling actions.
    -   `RuleEngineService`: Encapsulates the logic for assigning cases (Soft/Hard/Legal) based on DPD (Days Past Due).
    -   `NoticeService`: Generates PDF payment reminders using **Puppeteer**.

### Frontend (Next.js)
The frontend is a **Next.js 15** application using **React Server Components** and **Tailwind CSS**.
-   **UI Library**: Custom components built on top of `shadcn/ui` patterns (Radix UI + Tailwind).
-   **State Management**: URL-based state for filters and React Server Actions patterns for mutations.

## Key Design Decisions

### 1. The `POST /cases/full` Endpoint
I introduced a custom endpoint `POST /cases/full` to streamline the onboarding flow. The original assignment implied separate creation of Customer and Loan, but in a real-world simplified flow, it's often better to ingest a full context (Customer + Loan) to create a Case in one atomic transaction.
-   **Transactional Safety**: Creates Customer, Loan, and Case in a single `prisma.$transaction`. If any step fails, the database remains in a consistent state.
-   **Idempotency**: Checks for existing active cases for the same loan to prevent duplicates.

### 2. Validation Logic
-   **DTOs**: I use `class-validator` to enforce data integrity at the API entry point.
-   **Database Constraints**:
    -   `riskScore`: Enforced as `0-1000` (updated from an incorrect 1-100 during development).
    -   `email`: Unique constraint on Customer.
-   **Business Rules**:
    -   Cannot assign a case if it's already `RESOLVED` or `CLOSED`.
    -   Optimistic locking (via `version` field) prevents concurrent assignment updates.

### 3. Rule Engine
The rule engine is implemented as a stateless service (`RuleEngineService`). It evaluates a case against a set of predefined rules (DPD thresholds, Risk Score overrides) and returns a decision (Stage, Assignment Group). This design allows for easy unit testing and future extraction into a separate microservice or config-file-based loader if needed.

## Setup Instructions

1.  **Database**: Ensure PostgreSQL is running.
    ```bash
    # (Inside api folder)
    npx prisma migrate dev
    npm run db:seed
    ```
2.  **Backend**:
    ```bash
    cd api
    npm run start:dev
    ```
3.  **Frontend**:
    ```bash
    cd web
    npm run dev
    ```

## Known Limitations & Future Work
-   **Authentication**: Currently, the system assumes a single authenticated user context (mocked).
-   **Rule Configuration**: Rules are currently hardcoded in the service. Moving them to a JSON file or database table would allow dynamic updates without redeployment.

## Bonus Features Implemented
I have implemented the following bonus requirements:
1.  **Daily DPD Recalculation & Auto-Escalation**:
    -   Implemented a scheduled job (`DailyUpdateService`) that runs every midnight using `@nestjs/schedule`.
    -   It automatically recalculates DPD for all open cases and re-evaluates them against the assignment rules.
    -   If the rule outcome changes (e.g., stage moves from `SOFT` to `HARD`), the case is updated automatically.
    -   **How to Run/Test**:
        -   The job runs automatically at **midnight (server time)**.
        -   To test manually, you can change `CronExpression.EVERY_DAY_AT_MIDNIGHT` in `api/src/jobs/daily-update.service.ts` to `CronExpression.EVERY_10_SECONDS` (or similar) and restart the server.
        -   Check the terminal logs for: `Starting daily DPD recalculation...` and `Daily job completed. Processed: X, Updated: Y`.
2.  **Structured Logging**:
    -   Configured a global middleware/interceptor to output logs in JSON format for better observability.
