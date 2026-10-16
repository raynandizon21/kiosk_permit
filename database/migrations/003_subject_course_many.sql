-- A subject can belong to several courses. Moves subject.COURSE_ID into a link table.
-- A subject with no rows in subject_course is a general subject for all courses (e.g. GE).
-- Does NOT delete data. Run once, after 002_subject_course.sql.
USE `kiosk_permit`;

CREATE TABLE IF NOT EXISTS `subject_course` (
  `SUBJECT_ID` int(11) NOT NULL,
  `COURSE_ID` int(11) NOT NULL,
  PRIMARY KEY (`SUBJECT_ID`, `COURSE_ID`),
  KEY `idx_sc_course` (`COURSE_ID`),
  CONSTRAINT `fk_sc_subject` FOREIGN KEY (`SUBJECT_ID`) REFERENCES `subject` (`IDNo`) ON DELETE CASCADE,
  CONSTRAINT `fk_sc_course` FOREIGN KEY (`COURSE_ID`) REFERENCES `course` (`IDNo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `subject_course` (`SUBJECT_ID`, `COURSE_ID`)
SELECT `IDNo`, `COURSE_ID` FROM `subject` WHERE `COURSE_ID` IS NOT NULL;

ALTER TABLE `subject` DROP FOREIGN KEY `fk_subject_course`;
ALTER TABLE `subject` DROP INDEX `idx_subject_course`, DROP COLUMN `COURSE_ID`;
