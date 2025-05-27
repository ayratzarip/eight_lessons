-- AlterTable
ALTER TABLE "Logbook"
DROP COLUMN "attentionFocus",
DROP COLUMN "thoughts",
DROP COLUMN "bodySensations",
DROP COLUMN "actions",
DROP COLUMN "howToAct";

-- AlterTable
ALTER TABLE "Goal"
DROP COLUMN "text",
DROP COLUMN "isCompleted";