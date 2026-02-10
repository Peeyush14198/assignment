-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('SOFT', 'HARD', 'LEGAL');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AssignmentGroup" AS ENUM ('Tier1', 'Tier2', 'Legal');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CALL', 'SMS', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ActionOutcome" AS ENUM ('NO_ANSWER', 'PROMISE_TO_PAY', 'PAID', 'WRONG_NUMBER');

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Customer_riskScore_check" CHECK ("riskScore" >= 1 AND "riskScore" <= 100)
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "principal" DECIMAL(12,2) NOT NULL,
    "outstanding" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Loan_outstanding_check" CHECK ("outstanding" >= 0)
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "loanId" INTEGER NOT NULL,
    "dpd" INTEGER NOT NULL,
    "stage" "CaseStage" NOT NULL DEFAULT 'SOFT',
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "assignmentGroup" "AssignmentGroup",
    "assignedTo" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Case_dpd_check" CHECK ("dpd" >= 0)
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "type" "ActionType" NOT NULL,
    "outcome" "ActionOutcome" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleDecision" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "matchedRules" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "decisionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RuleDecision_decisionKey_key" ON "RuleDecision"("decisionKey");

-- CreateIndex
CREATE INDEX "idx_customers_risk_score" ON "Customer"("riskScore");
CREATE INDEX "idx_loans_customer_id" ON "Loan"("customerId");
CREATE INDEX "idx_loans_status" ON "Loan"("status");
CREATE INDEX "idx_cases_status_stage_dpd" ON "Case"("status", "stage", "dpd");
CREATE INDEX "idx_cases_assigned_to" ON "Case"("assignedTo");
CREATE INDEX "idx_cases_customer_id" ON "Case"("customerId");
CREATE INDEX "idx_cases_loan_id" ON "Case"("loanId");
CREATE INDEX "idx_action_logs_case_created_at" ON "ActionLog"("caseId", "createdAt");
CREATE INDEX "idx_rule_decisions_case_created_at" ON "RuleDecision"("caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Case" ADD CONSTRAINT "Case_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RuleDecision" ADD CONSTRAINT "RuleDecision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
