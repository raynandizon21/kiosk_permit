-- Adds a start/end date range to each school year / semester (shown as "From" / "To"
-- in File Maintenance > School Year & Semester). Does NOT delete data. Run once.
USE `kiosk_permit`;

ALTER TABLE `academic_period`
  ADD COLUMN `START_DATE` date DEFAULT NULL COMMENT 'Semester start, e.g. first day of classes' AFTER `ACTIVE_TERM`,
  ADD COLUMN `END_DATE` date DEFAULT NULL COMMENT 'Semester end, e.g. last day of finals' AFTER `START_DATE`;
