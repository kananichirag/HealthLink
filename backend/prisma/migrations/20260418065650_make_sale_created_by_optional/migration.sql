-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_createdBy_fkey";

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
