-- Self-Service Kiosk for Permit, Promissory Note and Statement of Account Services
-- St. Nicolas College — database schema (MySQL / MariaDB, XAMPP)
-- Run in phpMyAdmin, or: npm run db:setup
-- Safe to re-run: drops and recreates every table of this system.

CREATE DATABASE IF NOT EXISTS `kiosk_permit`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `kiosk_permit`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `withdrawal_request`;
DROP TABLE IF EXISTS `promissory_note`;
DROP TABLE IF EXISTS `exam_permit`;
DROP TABLE IF EXISTS `payment`;
DROP TABLE IF EXISTS `assessment_item`;
DROP TABLE IF EXISTS `assessment`;
DROP TABLE IF EXISTS `student_subject`;
DROP TABLE IF EXISTS `subject_course`;
DROP TABLE IF EXISTS `subject`;
DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `course`;
DROP TABLE IF EXISTS `academic_period`;
DROP TABLE IF EXISTS `user_info`;
SET FOREIGN_KEY_CHECKS = 1;

-- Accounting / registrar staff who use the admin portal
CREATE TABLE `user_info` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `FIRST_NAME` varchar(80) NOT NULL,
  `LAST_NAME` varchar(80) NOT NULL,
  `POSITION` varchar(80) DEFAULT NULL,
  `USERNAME` varchar(50) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL COMMENT 'bcrypt hash',
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_user_username` (`USERNAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- School year + semester. Exactly one row has IS_CURRENT = 1.
CREATE TABLE `academic_period` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `ACADEMIC_YEAR` varchar(20) NOT NULL COMMENT 'e.g. 2024-2025',
  `SEMESTER` varchar(30) NOT NULL COMMENT 'e.g. 1st Semester',
  `ACTIVE_TERM` enum('Long Test Prelim','Prelim','Long Test Midterm','Midterm','Prefinal','Finals') NOT NULL DEFAULT 'Prelim',
  `START_DATE` date DEFAULT NULL COMMENT 'Semester start, e.g. first day of classes',
  `END_DATE` date DEFAULT NULL COMMENT 'Semester end, e.g. last day of finals',
  `IS_CURRENT` tinyint(1) NOT NULL DEFAULT 0,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_period` (`ACADEMIC_YEAR`, `SEMESTER`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Programs offered (File Maintenance > Courses); student.COURSE stores the course NAME
CREATE TABLE `course` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `CODE` varchar(20) NOT NULL,
  `NAME` varchar(120) NOT NULL,
  `DEPARTMENT` varchar(120) DEFAULT NULL,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_course_code` (`CODE`),
  UNIQUE KEY `uk_course_name` (`NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `student` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `LRN` varchar(20) NOT NULL COMMENT 'Learner Reference Number',
  `STUDENT_NUMBER` varchar(30) NOT NULL,
  `RFID` varchar(50) DEFAULT NULL COMMENT 'Same school ID card used by library_rfid',
  `FIRSTNAME` varchar(80) NOT NULL,
  `LASTNAME` varchar(80) NOT NULL,
  `COURSE` varchar(120) NOT NULL,
  `DEPARTMENT` varchar(120) DEFAULT NULL,
  `YEAR_LEVEL` varchar(20) NOT NULL,
  `SECTION` varchar(30) NOT NULL,
  `CONTACTNo` varchar(30) DEFAULT NULL,
  `EMAIL` varchar(120) DEFAULT NULL,
  `GUARDIAN_NAME` varchar(120) DEFAULT NULL,
  `GUARDIAN_CONTACT` varchar(30) DEFAULT NULL,
  `ADDRESS` varchar(255) DEFAULT NULL,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  `EDITED_BY` int(11) DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_student_lrn` (`LRN`),
  UNIQUE KEY `uk_student_number` (`STUDENT_NUMBER`),
  UNIQUE KEY `uk_student_rfid` (`RFID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `subject` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `CODE` varchar(20) NOT NULL,
  `DESCRIPTION` varchar(255) NOT NULL,
  `UNITS` decimal(4,1) NOT NULL DEFAULT 3.0,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_subject_code` (`CODE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Courses a subject belongs to. No rows = general subject for all courses (e.g. GE).
CREATE TABLE `subject_course` (
  `SUBJECT_ID` int(11) NOT NULL,
  `COURSE_ID` int(11) NOT NULL,
  PRIMARY KEY (`SUBJECT_ID`, `COURSE_ID`),
  KEY `idx_sc_course` (`COURSE_ID`),
  CONSTRAINT `fk_sc_subject` FOREIGN KEY (`SUBJECT_ID`) REFERENCES `subject` (`IDNo`) ON DELETE CASCADE,
  CONSTRAINT `fk_sc_course` FOREIGN KEY (`COURSE_ID`) REFERENCES `course` (`IDNo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Enrolled subjects per student per semester (printed on the exam permit)
CREATE TABLE `student_subject` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `SUBJECT_ID` int(11) NOT NULL,
  `INSTRUCTOR` varchar(120) DEFAULT NULL,
  `SCHEDULE` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_student_subject` (`STUDENT_ID`, `PERIOD_ID`, `SUBJECT_ID`),
  CONSTRAINT `fk_ss_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  CONSTRAINT `fk_ss_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  CONSTRAINT `fk_ss_subject` FOREIGN KEY (`SUBJECT_ID`) REFERENCES `subject` (`IDNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Statement of Account header: one assessment per student per semester
CREATE TABLE `assessment` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `TUITION_FEE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `LAB_FEE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `MISC_FEE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `PREVIOUS_BALANCE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_assessment` (`STUDENT_ID`, `PERIOD_ID`),
  CONSTRAINT `fk_assess_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  CONSTRAINT `fk_assess_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Other fees and discounts on an assessment
CREATE TABLE `assessment_item` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `ASSESSMENT_ID` int(11) NOT NULL,
  `ITEM_NAME` varchar(150) NOT NULL,
  `AMOUNT` decimal(12,2) NOT NULL,
  `ITEM_TYPE` enum('fee','discount') NOT NULL DEFAULT 'fee',
  PRIMARY KEY (`IDNo`),
  KEY `idx_item_assessment` (`ASSESSMENT_ID`),
  CONSTRAINT `fk_item_assessment` FOREIGN KEY (`ASSESSMENT_ID`) REFERENCES `assessment` (`IDNo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Cashier payments (official receipts)
CREATE TABLE `payment` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `OR_NUMBER` varchar(40) NOT NULL,
  `AMOUNT` decimal(12,2) NOT NULL,
  `PAYMENT_METHOD` enum('Cash','GCash','Bank Transfer','Debit/Credit Card','Scholarship Voucher') NOT NULL DEFAULT 'Cash',
  `ALLOCATION` varchar(80) DEFAULT NULL COMMENT 'e.g. Midterm Examination Dues',
  `REMARKS` varchar(255) DEFAULT NULL,
  `PAYMENT_DT` date NOT NULL,
  `IS_DEPOSIT` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Held as account credit instead of applied to a term due; see withdrawal_request',
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_payment_or` (`OR_NUMBER`),
  KEY `idx_payment_student` (`STUDENT_ID`, `PERIOD_ID`),
  CONSTRAINT `fk_pay_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  CONSTRAINT `fk_pay_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- A self-service deposit (payment.IS_DEPOSIT = 1) the student later asks to cash out.
-- Available credit = sum of deposit payments − sum of released withdrawals.
CREATE TABLE `withdrawal_request` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `REFERENCE_NO` varchar(40) DEFAULT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `AMOUNT` decimal(12,2) NOT NULL,
  `STATUS` enum('pending','released','declined') NOT NULL DEFAULT 'pending',
  `REQUESTED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  `REVIEWED_BY` int(11) DEFAULT NULL,
  `REVIEWED_DT` datetime DEFAULT NULL,
  `REMARKS` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_wd_reference` (`REFERENCE_NO`),
  KEY `idx_wd_status` (`STATUS`),
  CONSTRAINT `fk_wd_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  CONSTRAINT `fk_wd_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  CONSTRAINT `fk_wd_reviewer` FOREIGN KEY (`REVIEWED_BY`) REFERENCES `user_info` (`IDNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exam permit per student per term. No row = locked.
CREATE TABLE `exam_permit` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `EXAM_TERM` enum('Long Test Prelim','Prelim','Long Test Midterm','Midterm','Prefinal','Finals') NOT NULL,
  `STATUS` enum('cleared','promissory_cleared','locked') NOT NULL DEFAULT 'locked',
  `PERMIT_NUMBER` varchar(40) DEFAULT NULL,
  `ISSUED_DT` datetime DEFAULT NULL,
  `ISSUED_BY` int(11) DEFAULT NULL,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_permit` (`STUDENT_ID`, `PERIOD_ID`, `EXAM_TERM`),
  CONSTRAINT `fk_permit_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  CONSTRAINT `fk_permit_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `promissory_note` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `REFERENCE_NO` varchar(40) DEFAULT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `EXAM_TERM` enum('Long Test Prelim','Prelim','Long Test Midterm','Midterm','Prefinal','Finals') NOT NULL,
  `BALANCE_AMOUNT` decimal(12,2) NOT NULL,
  `COMMITTED_AMOUNT` decimal(12,2) NOT NULL,
  `COMMITTED_DATE` date NOT NULL,
  `REASON_CATEGORY` enum('Family Emergency','Delayed Remittance','Salary/Payday Timing','Pending Scholarship','Medical Expense','Other') NOT NULL,
  `REASON_DETAILS` text DEFAULT NULL,
  `GUARDIAN_NAME` varchar(120) NOT NULL,
  `GUARDIAN_CONTACT` varchar(30) NOT NULL,
  `SIGNATURE` mediumtext DEFAULT NULL COMMENT 'PNG data URL from kiosk signature pad',
  `STATUS` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `SUBMITTED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  `REVIEWED_BY` int(11) DEFAULT NULL,
  `REVIEWED_DT` datetime DEFAULT NULL,
  `REVIEW_REMARKS` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`IDNo`),
  UNIQUE KEY `uk_pn_reference` (`REFERENCE_NO`),
  KEY `idx_pn_status` (`STATUS`),
  CONSTRAINT `fk_pn_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  CONSTRAINT `fk_pn_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  CONSTRAINT `fk_pn_reviewer` FOREIGN KEY (`REVIEWED_BY`) REFERENCES `user_info` (`IDNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Kiosk + admin activity trail
CREATE TABLE `audit_log` (
  `IDNo` int(11) NOT NULL AUTO_INCREMENT,
  `ACTION` varchar(40) NOT NULL COMMENT 'kiosk_login | soa_print | permit_print | payment_slip_print | deposit_slip_print | withdrawal_slip_print | promissory_submit | pn_approve | pn_reject | payment | wd_submit | wd_release | wd_decline | permit_override | term_change',
  `DESCRIPTION` varchar(500) NOT NULL,
  `ACTOR` varchar(120) NOT NULL,
  `STUDENT_ID` int(11) DEFAULT NULL,
  `LOG_DT` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`IDNo`),
  KEY `idx_log_dt` (`LOG_DT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
