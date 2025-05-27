-- First add the new columns with NULL allowed
ALTER TABLE "Logbook" ADD COLUMN "encryptedData" TEXT,
ADD COLUMN "iv" TEXT,
ALTER COLUMN "attentionFocus" SET DEFAULT '',
ALTER COLUMN "thoughts" SET DEFAULT '',
ALTER COLUMN "bodySensations" SET DEFAULT '',
ALTER COLUMN "actions" SET DEFAULT '',
ALTER COLUMN "howToAct" SET DEFAULT '';

-- Update existing records with placeholder encrypted data
-- This is a placeholder until proper encryption is applied
UPDATE "Logbook" 
SET "encryptedData" = 'placeholder',
    "iv" = 'placeholder';

-- Now make the columns NOT NULL
ALTER TABLE "Logbook" 
ALTER COLUMN "encryptedData" SET NOT NULL,
ALTER COLUMN "iv" SET NOT NULL;
