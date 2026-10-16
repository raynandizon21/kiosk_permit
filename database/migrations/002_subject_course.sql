-- Links each subject to a course (NULL = general subject for all courses, e.g. GE).
-- Does NOT delete data. Run once on databases created before this change.
USE `kiosk_permit`;

ALTER TABLE `subject`
  ADD COLUMN `COURSE_ID` int(11) DEFAULT NULL COMMENT 'NULL = general subject for all courses' AFTER `UNITS`,
  ADD KEY `idx_subject_course` (`COURSE_ID`),
  ADD CONSTRAINT `fk_subject_course` FOREIGN KEY (`COURSE_ID`) REFERENCES `course` (`IDNo`);

UPDATE `subject` s JOIN `course` c ON c.`CODE` = 'BSBA' SET s.`COURSE_ID` = c.`IDNo` WHERE s.`CODE` LIKE 'BA-%';
UPDATE `subject` s JOIN `course` c ON c.`CODE` = 'BSCRIM' SET s.`COURSE_ID` = c.`IDNo` WHERE s.`CODE` LIKE 'CRIM-%' OR s.`CODE` = 'PE-101';
UPDATE `subject` s JOIN `course` c ON c.`CODE` = 'BSHM' SET s.`COURSE_ID` = c.`IDNo` WHERE s.`CODE` LIKE 'HM-%';
UPDATE `subject` s JOIN `course` c ON c.`CODE` = 'BSIT' SET s.`COURSE_ID` = c.`IDNo` WHERE s.`CODE` LIKE 'IT-%';
UPDATE `subject` s JOIN `course` c ON c.`CODE` = 'SHS-STEM' SET s.`COURSE_ID` = c.`IDNo` WHERE s.`CODE` LIKE 'STEM-%' OR s.`CODE` = 'COR-09';
