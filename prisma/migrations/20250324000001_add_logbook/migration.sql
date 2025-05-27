-- CreateTable
CREATE TABLE "Logbook" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attentionFocus" TEXT NOT NULL,
  "thoughts" TEXT NOT NULL,
  "bodySensations" TEXT NOT NULL,
  "actions" TEXT NOT NULL,
  "howToAct" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Logbook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Logbook_userId_idx" ON "Logbook"("userId");

-- AddForeignKey
ALTER TABLE "Logbook" ADD CONSTRAINT "Logbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;