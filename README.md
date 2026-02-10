# Collections Case Manager (Full-Stack Assignment)

A full-stack delinquency collections case manager with:
- `api`: NestJS + Prisma + PostgreSQL backend
- `web`: Next.js frontend dashboard

## Features

- **Unified Case Creation**: Create a customer, loan, and case in a single workflow.
- **Action Logging**: Record "Call", "SMS", "Email", or "WhatsApp" interactions.
- **Rule-Based Assignment**: Automatically assign cases to "High Value" or "Standard" groups based on rules.
- **Notice Generation**: Generate PDF notices for cases.
- **Dashboard**: View key metrics and filter cases by status, stage, and DPD.

## Repository Structure

```text
.
├── api
│   ├── prisma
│   ├── rules
│   └── src
├── web
└── docker-compose.yml
```

## Prerequisites

- **Docker** and **Docker Compose**
- **Node.js** v18+ (for local development without Docker)

## Setup & Running

### Option 1: Docker (Recommended)

1.  Start all services (Database, API, Web):
    ```bash
    docker-compose up --build
    ```
    *Note: The API container will automatically run database migrations and seed initial data on startup.*

2.  Access the applications:
    - **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
    - **API Swagger**: [http://localhost:3001/api](http://localhost:3001/api)

### Option 2: Local Development

If you prefer to run services individually:

1.  **Database**:
    ```bash
    docker-compose up -d postgres
    ```

2.  **API**:
    ```bash
    cd api
    npm install
    npx prisma migrate deploy
    npm run db:seed
    npm run start:dev
    ```
    API runs at `http://localhost:3001`.

3.  **Web**:
    ```bash
    cd web
    npm install
    npm run dev
    ```
    Web runs at `http://localhost:3000`.

## Swagger API Documentation

Swagger is enabled in the API app and available at:
- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI JSON: `http://localhost:3001/api/docs-json`

Suggested flow for quick validation from Swagger UI:

1. `GET /api/cases` to verify list API.
2. `POST /api/cases` to create a new case (Legacy).
3. `POST /api/cases/full` to create a new case with Customer and Loan (Unified).
4. `POST /api/cases/{id}/assign` to run assignment.
5. `POST /api/cases/{id}/actions` to add an action log.
6. `GET /api/cases/{id}/notice.pdf` to generate/download PDF.
7. `GET /api/metrics` to verify dashboard metrics.

## Important API Endpoints

- `GET /api/cases` - list cases with filters and pagination
- `POST /api/cases/full` - create a case (Unified Flow)
- `GET /api/cases/:id` - case detail
- `POST /api/cases/:id/actions` - add action log
- `POST /api/cases/:id/assign` - run assignment engine
- `GET /api/cases/:id/notice.pdf` - generate payment reminder PDF
- `GET /api/metrics` - dashboard metrics

## Lint, Build, Test

### API

```bash
cd api
npm run lint
npm run build
npm run test
```

### Web

```bash
cd web
npm run lint
npm run build
```

## Rules Configuration

Assignment rules are loaded from:
- `api/rules/default-rules.json`

You can tune DPD/risk-based routing logic there without changing code.
