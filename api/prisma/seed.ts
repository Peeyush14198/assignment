import { CaseStatus, CaseStage, PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.actionLog.deleteMany();
  await prisma.ruleDecision.deleteMany();
  await prisma.case.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.customer.deleteMany();

  const customers = await prisma.customer.createManyAndReturn({
    data: [
      {
        name: 'Anita Verma',
        phone: '+91-9898989898',
        email: 'anita.verma@example.com',
        country: 'IN',
        riskScore: 45
      },
      {
        name: 'Rahul Singh',
        phone: '+91-9876543210',
        email: 'rahul.singh@example.com',
        country: 'IN',
        riskScore: 92
      },
      {
        name: 'Maya Johnson',
        phone: '+1-415-555-0123',
        email: 'maya.johnson@example.com',
        country: 'US',
        riskScore: 78
      }
    ]
  });

  const loans = await prisma.loan.createManyAndReturn({
    data: [
      {
        customerId: customers[0].id,
        principal: 100000,
        outstanding: 42000,
        dueDate: dayjs().subtract(5, 'day').toDate(),
        status: 'ACTIVE'
      },
      {
        customerId: customers[1].id,
        principal: 250000,
        outstanding: 198500,
        dueDate: dayjs().subtract(12, 'day').toDate(),
        status: 'ACTIVE'
      },
      {
        customerId: customers[2].id,
        principal: 80000,
        outstanding: 8050,
        dueDate: dayjs().subtract(35, 'day').toDate(),
        status: 'ACTIVE'
      }
    ]
  });

  const cases = await prisma.case.createManyAndReturn({
    data: [
      {
        customerId: customers[0].id,
        loanId: loans[0].id,
        dpd: 5,
        stage: CaseStage.SOFT,
        status: CaseStatus.OPEN,
        assignmentGroup: 'Tier1',
        assignedTo: 'Tier1Queue',
        version: 1
      },
      {
        customerId: customers[1].id,
        loanId: loans[1].id,
        dpd: 12,
        stage: CaseStage.HARD,
        status: CaseStatus.IN_PROGRESS,
        assignmentGroup: 'Tier2',
        assignedTo: 'SeniorAgent',
        version: 2
      },
      {
        customerId: customers[2].id,
        loanId: loans[2].id,
        dpd: 35,
        stage: CaseStage.LEGAL,
        status: CaseStatus.OPEN,
        assignmentGroup: 'Legal',
        assignedTo: 'LegalDesk',
        version: 1
      }
    ]
  });

  await prisma.actionLog.createMany({
    data: [
      {
        caseId: cases[0].id,
        type: 'CALL',
        outcome: 'NO_ANSWER',
        notes: 'No answer on first call'
      },
      {
        caseId: cases[1].id,
        type: 'CALL',
        outcome: 'PROMISE_TO_PAY',
        notes: 'Customer promised payment by Friday'
      },
      {
        caseId: cases[1].id,
        type: 'SMS',
        outcome: 'PROMISE_TO_PAY',
        notes: 'Sent payment reminder SMS'
      },
      {
        caseId: cases[2].id,
        type: 'EMAIL',
        outcome: 'NO_ANSWER',
        notes: 'Escalation email sent'
      }
    ]
  });

  await prisma.ruleDecision.createMany({
    data: [
      {
        caseId: cases[0].id,
        matchedRules: ['DPD_1_7'],
        reason: 'dpd=5 -> Tier1',
        decisionKey: 'seed-case-1'
      },
      {
        caseId: cases[1].id,
        matchedRules: ['DPD_8_30', 'RISK_GT_80_OVERRIDE'],
        reason: 'dpd=12 -> Tier2; riskScore=92 -> SeniorAgent override',
        decisionKey: 'seed-case-2'
      },
      {
        caseId: cases[2].id,
        matchedRules: ['DPD_GT_30'],
        reason: 'dpd=35 -> Legal',
        decisionKey: 'seed-case-3'
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
