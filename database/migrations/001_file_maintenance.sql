-- Adds the file-maintenance tables to an existing kiosk_permit database WITHOUT deleting data.
-- Safe to run more than once. (schema.sql + seed.sql already include all of this for fresh installs.)
USE `kiosk_permit`;

CREATE TABLE IF NOT EXISTS `course` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `CODE` varchar(20) NOT NULL,
  `NAME` varchar(120) NOT NULL,
  `DEPARTMENT` varchar(120) DEFAULT NULL,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_course_code` (`CODE`),
  UNIQUE KEY `uk_course_name` (`NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `course` (`CODE`, `NAME`, `DEPARTMENT`) VALUES
('BSIT', 'BS Information Technology', 'College of Computer Studies'),
('BSBA', 'BS Business Administration', 'College of Business and Accountancy'),
('BSCrim', 'BS Criminology', 'College of Criminal Justice Education'),
('BSHM', 'BS Hospitality Management', 'College of International Hospitality Management'),
('SHS-STEM', 'Senior High School - STEM Strand', 'Basic Education Department');
