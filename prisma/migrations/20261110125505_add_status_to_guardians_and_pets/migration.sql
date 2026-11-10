-- AlterTable
ALTER TABLE "guardians" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';
