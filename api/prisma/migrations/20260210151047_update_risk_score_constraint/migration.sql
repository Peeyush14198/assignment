-- Drop the old constraint
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_riskScore_check";
-- Add the new constraint allowing 0-1000 range
ALTER TABLE "Customer"
ADD CONSTRAINT "Customer_riskScore_check" CHECK (
        "riskScore" >= 0
        AND "riskScore" <= 1000
    );