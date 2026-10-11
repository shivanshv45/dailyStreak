-- AlterEnum
ALTER TYPE "Frequency" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "intervalDays" INTEGER;
