-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "isRescheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Appointment_isRescheduled_idx" ON "Appointment"("isRescheduled");
