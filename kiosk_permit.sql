-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 16, 2026 at 09:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kiosk_permit`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_period`
--

CREATE TABLE `academic_period` (
  `IDNo` int(11) NOT NULL,
  `ACADEMIC_YEAR` varchar(20) NOT NULL COMMENT 'e.g. 2024-2025',
  `SEMESTER` varchar(30) NOT NULL COMMENT 'e.g. 1st Semester',
  `ACTIVE_TERM` enum('Prelim','Midterm','Prefinal','Finals') NOT NULL DEFAULT 'Prelim',
  `IS_CURRENT` tinyint(1) NOT NULL DEFAULT 0,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `academic_period`
--

INSERT INTO `academic_period` (`IDNo`, `ACADEMIC_YEAR`, `SEMESTER`, `ACTIVE_TERM`, `IS_CURRENT`, `ACTIVE`) VALUES
(1, '2024-2025', '1st Semester', 'Prelim', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `assessment`
--

CREATE TABLE `assessment` (
  `IDNo` int(11) NOT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `TUITION_FEE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `LAB_FEE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `MISC_FEE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `PREVIOUS_BALANCE` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assessment`
--

INSERT INTO `assessment` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `TUITION_FEE`, `LAB_FEE`, `MISC_FEE`, `PREVIOUS_BALANCE`, `ENCODED_BY`, `ENCODED_DT`) VALUES
(1, 1, 1, 16500.00, 4200.00, 3800.00, 0.00, 1, '2026-10-16 13:16:42'),
(2, 2, 1, 14500.00, 1200.00, 3600.00, 1200.00, 1, '2026-10-16 13:16:42'),
(3, 3, 1, 15800.00, 3500.00, 3900.00, 0.00, 1, '2026-10-16 13:16:42'),
(4, 4, 1, 11000.00, 2400.00, 2800.00, 0.00, 1, '2026-10-16 13:16:42'),
(5, 5, 1, 17200.00, 5800.00, 4100.00, 0.00, 1, '2026-10-16 13:16:42');

-- --------------------------------------------------------

--
-- Table structure for table `assessment_item`
--

CREATE TABLE `assessment_item` (
  `IDNo` int(11) NOT NULL,
  `ASSESSMENT_ID` int(11) NOT NULL,
  `ITEM_NAME` varchar(150) NOT NULL,
  `AMOUNT` decimal(12,2) NOT NULL,
  `ITEM_TYPE` enum('fee','discount') NOT NULL DEFAULT 'fee'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assessment_item`
--

INSERT INTO `assessment_item` (`IDNo`, `ASSESSMENT_ID`, `ITEM_NAME`, `AMOUNT`, `ITEM_TYPE`) VALUES
(1, 1, 'Computer Lab / Internet Fee', 1500.00, 'fee'),
(2, 1, 'Supreme Student Council (SSC)', 250.00, 'fee'),
(3, 1, 'Student Insurance & Red Cross', 200.00, 'fee'),
(4, 1, 'Athletic & Cultural Fee', 450.00, 'fee'),
(5, 1, 'Academic Honor Dean\'s List (10% Tuition)', 1650.00, 'discount'),
(6, 2, 'Business Lab Simulation', 800.00, 'fee'),
(7, 2, 'Supreme Student Council', 250.00, 'fee'),
(8, 2, 'Student Insurance', 200.00, 'fee'),
(9, 3, 'Criminology Uniform / Badge Fee', 1800.00, 'fee'),
(10, 3, 'Defensive Tactics / Physical Defense', 1200.00, 'fee'),
(11, 3, 'Supreme Student Council', 250.00, 'fee'),
(12, 4, 'DepEd Voucher Subsidy Applied', 0.00, 'fee'),
(13, 4, 'Science Laboratory Kit', 650.00, 'fee'),
(14, 4, 'Student Handbook & ID', 350.00, 'fee'),
(15, 4, 'DepEd Senior High School Voucher', 8000.00, 'discount'),
(16, 5, 'Commercial Kitchen Consumables', 2200.00, 'fee'),
(17, 5, 'Food & Beverage Service Assessment', 1500.00, 'fee'),
(18, 5, 'Graduation & Yearbook Deposit', 1200.00, 'fee');

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `IDNo` int(11) NOT NULL,
  `ACTION` varchar(40) NOT NULL COMMENT 'kiosk_login | soa_print | permit_print | promissory_submit | pn_approve | pn_reject | payment | permit_override | term_change',
  `DESCRIPTION` varchar(500) NOT NULL,
  `ACTOR` varchar(120) NOT NULL,
  `STUDENT_ID` int(11) DEFAULT NULL,
  `LOG_DT` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`IDNo`, `ACTION`, `DESCRIPTION`, `ACTOR`, `STUDENT_ID`, `LOG_DT`) VALUES
(5, 'maintenance', 'Updated subject BA-201 — Financial Management I', 'Yves Tapnio', NULL, '2026-10-16 15:41:27'),
(6, 'maintenance', 'Updated subject BA-201 — Financial Management I', 'Yves Tapnio', NULL, '2026-10-16 15:41:39'),
(7, 'maintenance', 'Updated subject BA-201 — Financial Management I', 'Yves Tapnio', NULL, '2026-10-16 15:42:18'),
(8, 'kiosk_login', 'Signed in at the self-service kiosk', 'Kiosk', 3, '2026-10-16 15:43:13'),
(9, 'promissory_submit', 'Applied for Prelim promissory note SNC-PN-2026-0001: ₱13,225 on 2026-10-30', 'Kiosk', 3, '2026-10-16 15:43:40'),
(10, 'promissory_print', 'Printed promissory note receipt SNC-PN-2026-0001', 'Kiosk', 3, '2026-10-16 15:43:40'),
(11, 'kiosk_login', 'Signed in at the self-service kiosk', 'Kiosk', 3, '2026-10-16 15:43:54'),
(12, 'pn_approve', 'Promissory note SNC-PN-2026-0001 (Prelim) approved. Approved for Prelim Examination. Balance to be settled on or before 2026-10-30.', 'Yves Tapnio', 3, '2026-10-16 15:44:16'),
(13, 'permit_override', 'Midterm permit manually set to cleared', 'Yves Tapnio', 3, '2026-10-16 15:44:29'),
(14, 'kiosk_login', 'Signed in at the self-service kiosk', 'Kiosk', 3, '2026-10-16 15:44:55'),
(17, 'maintenance', 'Updated subject BA-201 — Financial Management I', 'Yves Tapnio', NULL, '2026-10-16 15:57:33');

-- --------------------------------------------------------

--
-- Table structure for table `course`
--

CREATE TABLE `course` (
  `IDNo` int(11) NOT NULL,
  `CODE` varchar(20) NOT NULL,
  `NAME` varchar(120) NOT NULL,
  `DEPARTMENT` varchar(120) DEFAULT NULL,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course`
--

INSERT INTO `course` (`IDNo`, `CODE`, `NAME`, `DEPARTMENT`, `ACTIVE`) VALUES
(1, 'BSIT', 'BS Information Technology', 'College of Computer Studies', 1),
(2, 'BSBA', 'BS Business Administration', 'College of Business and Accountancy', 1),
(3, 'BSCrim', 'BS Criminology', 'College of Criminal Justice Education', 1),
(4, 'BSHM', 'BS Hospitality Management', 'College of International Hospitality Management', 1),
(5, 'SHS-STEM', 'Senior High School - STEM Strand', 'Basic Education Department', 1);

-- --------------------------------------------------------

--
-- Table structure for table `exam_permit`
--

CREATE TABLE `exam_permit` (
  `IDNo` int(11) NOT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `EXAM_TERM` enum('Prelim','Midterm','Prefinal','Finals') NOT NULL,
  `STATUS` enum('cleared','promissory_cleared','locked') NOT NULL DEFAULT 'locked',
  `PERMIT_NUMBER` varchar(40) DEFAULT NULL,
  `ISSUED_DT` datetime DEFAULT NULL,
  `ISSUED_BY` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `exam_permit`
--

INSERT INTO `exam_permit` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `EXAM_TERM`, `STATUS`, `PERMIT_NUMBER`, `ISSUED_DT`, `ISSUED_BY`) VALUES
(1, 3, 1, 'Prelim', 'promissory_cleared', 'SNC-PR-10003-PN', '2026-10-16 15:44:16', 1),
(2, 3, 1, 'Midterm', 'cleared', 'SNC-MT-10003-M', '2026-10-16 15:44:29', 1);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `IDNo` int(11) NOT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `OR_NUMBER` varchar(40) NOT NULL,
  `AMOUNT` decimal(12,2) NOT NULL,
  `PAYMENT_METHOD` enum('Cash','GCash','Bank Transfer','Debit/Credit Card','Scholarship Voucher') NOT NULL DEFAULT 'Cash',
  `ALLOCATION` varchar(80) DEFAULT NULL COMMENT 'e.g. Midterm Examination Dues',
  `REMARKS` varchar(255) DEFAULT NULL,
  `PAYMENT_DT` date NOT NULL,
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promissory_note`
--

CREATE TABLE `promissory_note` (
  `IDNo` int(11) NOT NULL,
  `REFERENCE_NO` varchar(40) DEFAULT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `EXAM_TERM` enum('Prelim','Midterm','Prefinal','Finals') NOT NULL,
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
  `REVIEW_REMARKS` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promissory_note`
--

INSERT INTO `promissory_note` (`IDNo`, `REFERENCE_NO`, `STUDENT_ID`, `PERIOD_ID`, `EXAM_TERM`, `BALANCE_AMOUNT`, `COMMITTED_AMOUNT`, `COMMITTED_DATE`, `REASON_CATEGORY`, `REASON_DETAILS`, `GUARDIAN_NAME`, `GUARDIAN_CONTACT`, `SIGNATURE`, `STATUS`, `SUBMITTED_DT`, `REVIEWED_BY`, `REVIEWED_DT`, `REVIEW_REMARKS`) VALUES
(1, 'SNC-PN-2026-0001', 3, 1, 'Prelim', 26450.00, 13225.00, '2026-10-30', 'Family Emergency', NULL, 'Rolando Bautista', '0930-112-9988', 'data:image/png;base64,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', 'approved', '2026-10-16 15:43:40', 1, '2026-10-16 15:44:16', 'Approved for Prelim Examination. Balance to be settled on or before 2026-10-30.');

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `IDNo` int(11) NOT NULL,
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
  `EDITED_DT` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student`
--

INSERT INTO `student` (`IDNo`, `LRN`, `STUDENT_NUMBER`, `RFID`, `FIRSTNAME`, `LASTNAME`, `COURSE`, `DEPARTMENT`, `YEAR_LEVEL`, `SECTION`, `CONTACTNo`, `EMAIL`, `GUARDIAN_NAME`, `GUARDIAN_CONTACT`, `ADDRESS`, `ACTIVE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`) VALUES
(1, '109283746501', 'SNC-2023-0104', NULL, 'Juan Miguel', 'Dela Cruz', 'BS Information Technology', 'College of Computer Studies', '3rd Year', 'BSIT 3-A', '0917-829-4501', 'jmdelacruz@snc.edu.ph', 'Eduardo Dela Cruz', '0918-554-1234', 'Brgy. Dolores, City of San Fernando, Pampanga', 1, 1, '2026-10-16 13:16:42', NULL, NULL),
(2, '109283746502', 'SNC-2023-0245', NULL, 'Maria Clarisse', 'Santos', 'BS Business Administration', 'College of Business and Accountancy', '2nd Year', 'BSBA 2-B', '0920-412-9844', 'mcsantos@snc.edu.ph', 'Luzviminda Santos', '0919-876-5432', 'Sindalan, City of San Fernando, Pampanga', 1, 1, '2026-10-16 13:16:42', NULL, NULL),
(3, '109283746503', 'SNC-2024-0089', NULL, 'Mark Anthony', 'Bautista', 'BS Criminology', 'College of Criminal Justice Education', '1st Year', 'BSCrim 1-C', '0945-312-7788', 'mabautista@snc.edu.ph', 'Rolando Bautista', '0930-112-9988', 'San Agustin, San Fernando, Pampanga', 1, 1, '2026-10-16 13:16:42', NULL, NULL),
(4, '109283746504', 'SNC-SHS-2023-091', NULL, 'Sophia Andrea', 'Reyes', 'Senior High School - STEM Strand', 'Basic Education Department', 'Grade 12', 'STEM 12-A', '0915-778-9012', 'sareyes@snc.edu.ph', 'Marilou Reyes', '0922-345-6789', 'Telabastagan, City of San Fernando, Pampanga', 1, 1, '2026-10-16 13:16:42', NULL, NULL),
(5, '109283746505', 'SNC-2022-0411', NULL, 'Joshua Paolo', 'Lim', 'BS Hospitality Management', 'College of International Hospitality Management', '4th Year', 'BSHM 4-A', '0918-294-8172', 'jplim@snc.edu.ph', 'Vicente Lim', '0917-334-9021', 'Maimpis, City of San Fernando, Pampanga', 1, 1, '2026-10-16 13:16:42', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_subject`
--

CREATE TABLE `student_subject` (
  `IDNo` int(11) NOT NULL,
  `STUDENT_ID` int(11) NOT NULL,
  `PERIOD_ID` int(11) NOT NULL,
  `SUBJECT_ID` int(11) NOT NULL,
  `INSTRUCTOR` varchar(120) DEFAULT NULL,
  `SCHEDULE` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_subject`
--

INSERT INTO `student_subject` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `SUBJECT_ID`, `INSTRUCTOR`, `SCHEDULE`) VALUES
(1, 1, 1, 1, 'Prof. Dennis Morales, MIT', 'MW 08:00 - 09:30 AM (ComLab 2)'),
(2, 1, 1, 2, 'Engr. Katherine Santos, MSIT', 'TTH 10:00 - 11:30 AM (Room 304)'),
(3, 1, 1, 3, 'Prof. Ronald David', 'MW 01:00 - 02:30 PM (ComLab 3)'),
(4, 1, 1, 4, 'Prof. Christian Pineda', 'TTH 01:00 - 02:30 PM (ComLab 1)'),
(5, 1, 1, 5, 'Dr. Maria Elena Castro', 'F 09:00 - 12:00 PM (AVR 1)'),
(6, 2, 1, 6, 'Prof. Grace Villanueva, CPA', 'MW 09:30 - 11:00 AM (Room 201)'),
(7, 2, 1, 7, 'Prof. Jonathan Dizon', 'TTH 08:00 - 09:30 AM (Room 204)'),
(8, 2, 1, 8, 'Dr. Ramon Bautista', 'TTH 01:00 - 02:30 PM (Room 203)'),
(9, 2, 1, 9, 'Prof. Mary Ann Cruz', 'MW 01:00 - 02:30 PM (Room 105)'),
(10, 3, 1, 10, 'Atty. Victoriano Guinto', 'MWF 07:30 - 08:30 AM (Room 101)'),
(11, 3, 1, 11, 'Capt. Noel Manalang, MSCrim', 'TTH 09:00 - 10:30 AM (Room 102)'),
(12, 3, 1, 12, 'Coach Dante Mallari', 'Sat 08:00 - 10:00 AM (Gymnasium)'),
(13, 3, 1, 13, 'Prof. Rowena Tolentino', 'MWF 10:30 - 11:30 AM (Room 104)'),
(14, 4, 1, 14, 'Sir Arnel Guinto', 'MWF 08:00 - 09:30 AM (SciLab 1)'),
(15, 4, 1, 15, 'Maam Jennifer David', 'TTH 10:00 - 12:00 PM (SciLab 2)'),
(16, 4, 1, 16, 'Sir Michael Ocampo', 'MWF 01:00 - 02:00 PM (Room 402)'),
(17, 4, 1, 17, 'Coach Alvin Bondoc', 'Sat 09:00 - 11:00 AM (Quadrangle)'),
(18, 5, 1, 18, 'Chef Roderick Baluyut', 'M 08:00 - 01:00 PM (Hot Kitchen)'),
(19, 5, 1, 19, 'Prof. Cecille Dantes', 'TTH 09:00 - 10:30 AM (Mock Hotel)'),
(20, 5, 1, 20, 'Prof. Melissa Galang', 'W 01:00 - 05:00 PM (Banquet Hall)'),
(21, 5, 1, 21, 'Dean Alejandro David', 'F 02:00 - 05:00 PM (AVR 2)');

-- --------------------------------------------------------

--
-- Table structure for table `subject`
--

CREATE TABLE `subject` (
  `IDNo` int(11) NOT NULL,
  `CODE` varchar(20) NOT NULL,
  `DESCRIPTION` varchar(255) NOT NULL,
  `UNITS` decimal(4,1) NOT NULL DEFAULT 3.0,
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subject`
--

INSERT INTO `subject` (`IDNo`, `CODE`, `DESCRIPTION`, `UNITS`, `ACTIVE`) VALUES
(1, 'IT-311', 'Web Systems and Technologies II', 3.0, 1),
(2, 'IT-312', 'Information Assurance and Security', 3.0, 1),
(3, 'IT-313', 'Systems Integration and Architecture', 3.0, 1),
(4, 'IT-314', 'Mobile Application Development', 3.0, 1),
(5, 'GE-08', 'Ethics and Moral Philosophy', 3.0, 1),
(6, 'BA-201', 'Financial Management I', 3.0, 1),
(7, 'BA-202', 'Human Resource Management', 3.0, 1),
(8, 'BA-203', 'Marketing Research and Consumer Behavior', 3.0, 1),
(9, 'GE-05', 'Purposive Communication', 3.0, 1),
(10, 'CRIM-101', 'Introduction to Philippine Criminal Justice', 3.0, 1),
(11, 'CRIM-102', 'Theories of Crime Causation', 3.0, 1),
(12, 'PE-101', 'Marksmanship and Defensive Tactics', 2.0, 1),
(13, 'GE-01', 'Understanding the Self', 3.0, 1),
(14, 'STEM-121', 'General Physics 2', 4.0, 1),
(15, 'STEM-122', 'General Chemistry 2', 4.0, 1),
(16, 'STEM-123', 'Basic Calculus', 3.0, 1),
(17, 'COR-09', 'Physical Education and Health 3', 2.0, 1),
(18, 'HM-401', 'International Cuisine and Gastronomy', 3.0, 1),
(19, 'HM-402', 'Front Office Systems Simulation (Opera PMS)', 3.0, 1),
(20, 'HM-403', 'Events Management and Catering Operations', 3.0, 1),
(21, 'HM-404', 'Practicum and Internship Seminar', 3.0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `subject_course`
--

CREATE TABLE `subject_course` (
  `SUBJECT_ID` int(11) NOT NULL,
  `COURSE_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subject_course`
--

INSERT INTO `subject_course` (`SUBJECT_ID`, `COURSE_ID`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(6, 2),
(6, 4),
(7, 2),
(8, 2),
(10, 3),
(11, 3),
(12, 3),
(14, 5),
(15, 5),
(16, 5),
(17, 5),
(18, 4),
(19, 4),
(20, 4),
(21, 4);

-- --------------------------------------------------------

--
-- Table structure for table `user_info`
--

CREATE TABLE `user_info` (
  `IDNo` int(11) NOT NULL,
  `FIRST_NAME` varchar(80) NOT NULL,
  `LAST_NAME` varchar(80) NOT NULL,
  `POSITION` varchar(80) DEFAULT NULL,
  `USERNAME` varchar(50) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL COMMENT 'bcrypt hash',
  `ACTIVE` tinyint(1) NOT NULL DEFAULT 1,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_info`
--

INSERT INTO `user_info` (`IDNo`, `FIRST_NAME`, `LAST_NAME`, `POSITION`, `USERNAME`, `PASSWORD`, `ACTIVE`, `ENCODED_DT`) VALUES
(1, 'Yves', 'Tapnio', 'Admin', 'admin', '$2b$10$ZuidrgJ8NRyIwi0Eq.MiJO8WIojJ.gkuJPPgJb10vfsTwjT4A/D3G', 1, '2026-10-16 13:16:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_period`
--
ALTER TABLE `academic_period`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_period` (`ACADEMIC_YEAR`,`SEMESTER`);

--
-- Indexes for table `assessment`
--
ALTER TABLE `assessment`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_assessment` (`STUDENT_ID`,`PERIOD_ID`),
  ADD KEY `fk_assess_period` (`PERIOD_ID`);

--
-- Indexes for table `assessment_item`
--
ALTER TABLE `assessment_item`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_item_assessment` (`ASSESSMENT_ID`);

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_log_dt` (`LOG_DT`);

--
-- Indexes for table `course`
--
ALTER TABLE `course`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_course_code` (`CODE`),
  ADD UNIQUE KEY `uk_course_name` (`NAME`);

--
-- Indexes for table `exam_permit`
--
ALTER TABLE `exam_permit`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_permit` (`STUDENT_ID`,`PERIOD_ID`,`EXAM_TERM`),
  ADD KEY `fk_permit_period` (`PERIOD_ID`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_payment_or` (`OR_NUMBER`),
  ADD KEY `idx_payment_student` (`STUDENT_ID`,`PERIOD_ID`),
  ADD KEY `fk_pay_period` (`PERIOD_ID`);

--
-- Indexes for table `promissory_note`
--
ALTER TABLE `promissory_note`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_pn_reference` (`REFERENCE_NO`),
  ADD KEY `idx_pn_status` (`STATUS`),
  ADD KEY `fk_pn_student` (`STUDENT_ID`),
  ADD KEY `fk_pn_period` (`PERIOD_ID`),
  ADD KEY `fk_pn_reviewer` (`REVIEWED_BY`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_student_lrn` (`LRN`),
  ADD UNIQUE KEY `uk_student_number` (`STUDENT_NUMBER`),
  ADD UNIQUE KEY `uk_student_rfid` (`RFID`);

--
-- Indexes for table `student_subject`
--
ALTER TABLE `student_subject`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_student_subject` (`STUDENT_ID`,`PERIOD_ID`,`SUBJECT_ID`),
  ADD KEY `fk_ss_period` (`PERIOD_ID`),
  ADD KEY `fk_ss_subject` (`SUBJECT_ID`);

--
-- Indexes for table `subject`
--
ALTER TABLE `subject`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_subject_code` (`CODE`);

--
-- Indexes for table `subject_course`
--
ALTER TABLE `subject_course`
  ADD PRIMARY KEY (`SUBJECT_ID`,`COURSE_ID`),
  ADD KEY `idx_sc_course` (`COURSE_ID`);

--
-- Indexes for table `user_info`
--
ALTER TABLE `user_info`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `uk_user_username` (`USERNAME`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_period`
--
ALTER TABLE `academic_period`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `assessment`
--
ALTER TABLE `assessment`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `assessment_item`
--
ALTER TABLE `assessment_item`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `course`
--
ALTER TABLE `course`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `exam_permit`
--
ALTER TABLE `exam_permit`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `promissory_note`
--
ALTER TABLE `promissory_note`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `student_subject`
--
ALTER TABLE `student_subject`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `subject`
--
ALTER TABLE `subject`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `user_info`
--
ALTER TABLE `user_info`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assessment`
--
ALTER TABLE `assessment`
  ADD CONSTRAINT `fk_assess_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  ADD CONSTRAINT `fk_assess_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`);

--
-- Constraints for table `assessment_item`
--
ALTER TABLE `assessment_item`
  ADD CONSTRAINT `fk_item_assessment` FOREIGN KEY (`ASSESSMENT_ID`) REFERENCES `assessment` (`IDNo`) ON DELETE CASCADE;

--
-- Constraints for table `exam_permit`
--
ALTER TABLE `exam_permit`
  ADD CONSTRAINT `fk_permit_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  ADD CONSTRAINT `fk_permit_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_pay_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  ADD CONSTRAINT `fk_pay_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`);

--
-- Constraints for table `promissory_note`
--
ALTER TABLE `promissory_note`
  ADD CONSTRAINT `fk_pn_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  ADD CONSTRAINT `fk_pn_reviewer` FOREIGN KEY (`REVIEWED_BY`) REFERENCES `user_info` (`IDNo`),
  ADD CONSTRAINT `fk_pn_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`);

--
-- Constraints for table `student_subject`
--
ALTER TABLE `student_subject`
  ADD CONSTRAINT `fk_ss_period` FOREIGN KEY (`PERIOD_ID`) REFERENCES `academic_period` (`IDNo`),
  ADD CONSTRAINT `fk_ss_student` FOREIGN KEY (`STUDENT_ID`) REFERENCES `student` (`IDNo`),
  ADD CONSTRAINT `fk_ss_subject` FOREIGN KEY (`SUBJECT_ID`) REFERENCES `subject` (`IDNo`);

--
-- Constraints for table `subject_course`
--
ALTER TABLE `subject_course`
  ADD CONSTRAINT `fk_sc_course` FOREIGN KEY (`COURSE_ID`) REFERENCES `course` (`IDNo`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sc_subject` FOREIGN KEY (`SUBJECT_ID`) REFERENCES `subject` (`IDNo`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
