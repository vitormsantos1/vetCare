-- DropForeignKey
ALTER TABLE "pets" DROP CONSTRAINT "pets_guardian_id_fkey";

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;
