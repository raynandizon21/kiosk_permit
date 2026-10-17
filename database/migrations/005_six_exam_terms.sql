-- Splits each exam period into 6 terms instead of 4: Long Test Prelim, Prelim,
-- Long Test Midterm, Midterm, Prefinal, Finals. Existing data for the original 4
-- terms is untouched; the 2 new terms simply have no rows yet (kiosk/portal treat
-- a missing exam_permit row as "locked" by default). Does NOT delete data. Run once.
USE `kiosk_permit`;

ALTER TABLE `academic_period`
  MODIFY COLUMN `ACTIVE_TERM` enum('Long Test Prelim','Prelim','Long Test Midterm','Midterm','Prefinal','Finals') NOT NULL DEFAULT 'Prelim';

ALTER TABLE `exam_permit`
  MODIFY COLUMN `EXAM_TERM` enum('Long Test Prelim','Prelim','Long Test Midterm','Midterm','Prefinal','Finals') NOT NULL;

ALTER TABLE `promissory_note`
  MODIFY COLUMN `EXAM_TERM` enum('Long Test Prelim','Prelim','Long Test Midterm','Midterm','Prefinal','Finals') NOT NULL;
