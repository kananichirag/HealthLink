-- CreateIndex
CREATE INDEX "Medicine_quantity_expiryDate_idx" ON "Medicine"("quantity", "expiryDate");

-- CreateIndex
CREATE INDEX "Medicine_createdAt_idx" ON "Medicine"("createdAt");
