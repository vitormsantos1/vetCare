/*
  Warnings:

  - You are about to drop the column `number` on the `guardians` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `guardians` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cpf` to the `guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `species` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pets" DROP CONSTRAINT "pets_guardian_id_fkey";

-- DropIndex
DROP INDEX "guardians_email_key";

-- AlterTable
ALTER TABLE "guardians" DROP COLUMN "number",
ADD COLUMN     "cpf" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "species" TEXT NOT NULL,
ALTER COLUMN "birth_date" DROP NOT NULL,
ALTER COLUMN "breed" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "guardians_cpf_key" ON "guardians"("cpf");

-- CreateIndex
CREATE INDEX "guardians_name_idx" ON "guardians"("name");

-- CreateIndex
CREATE INDEX "pets_guardian_id_idx" ON "pets"("guardian_id");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
