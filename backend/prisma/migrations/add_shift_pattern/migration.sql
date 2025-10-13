-- CreateEnum
CREATE TYPE "staff_shiftPattern" AS ENUM ('FIXED', 'ROTATING_DAY_NIGHT');

-- AlterTable
ALTER TABLE "staff" ADD COLUMN "shiftPattern" "staff_shiftPattern" NOT NULL DEFAULT 'FIXED';

-- Update existing staff to have FIXED pattern (maintains current behavior)
UPDATE "staff" SET "shiftPattern" = 'FIXED';
