-- Starting data for the Permit / Promissory Note / SOA kiosk: file maintenance only
-- (admin user, school year, courses, subjects, students with their assessment and subjects).
-- No payments, permits, or promissory notes — those are created while using the system.
-- Run after schema.sql. Default admin login: admin / admin123 (change after first login).
USE `kiosk_permit`;

INSERT INTO `user_info` (`FIRST_NAME`, `LAST_NAME`, `POSITION`, `USERNAME`, `PASSWORD`) VALUES
('Yves', 'Tapnio', 'Registrar', 'admin', '$2b$10$ZuidrgJ8NRyIwi0Eq.MiJO8WIojJ.gkuJPPgJb10vfsTwjT4A/D3G');

INSERT INTO `academic_period` (`ACADEMIC_YEAR`, `SEMESTER`, `ACTIVE_TERM`, `START_DATE`, `END_DATE`, `IS_CURRENT`) VALUES
('2024-2025', '1st Semester', 'Midterm', '2024-08-05', '2024-12-20', 1);

INSERT INTO `course` (`CODE`, `NAME`, `DEPARTMENT`) VALUES
('BSIT', 'BS Information Technology', 'College of Computer Studies'),
('BSBA', 'BS Business Administration', 'College of Business and Accountancy'),
('BSCrim', 'BS Criminology', 'College of Criminal Justice Education'),
('BSHM', 'BS Hospitality Management', 'College of International Hospitality Management'),
('SHS-STEM', 'Senior High School - STEM Strand', 'Basic Education Department');

INSERT INTO `subject` (`CODE`, `DESCRIPTION`, `UNITS`) VALUES
('IT-311', 'Web Systems and Technologies II', 3),
('IT-312', 'Information Assurance and Security', 3),
('IT-313', 'Systems Integration and Architecture', 3),
('IT-314', 'Mobile Application Development', 3),
('GE-08', 'Ethics and Moral Philosophy', 3),
('BA-201', 'Financial Management I', 3),
('BA-202', 'Human Resource Management', 3),
('BA-203', 'Marketing Research and Consumer Behavior', 3),
('GE-05', 'Purposive Communication', 3),
('CRIM-101', 'Introduction to Philippine Criminal Justice', 3),
('CRIM-102', 'Theories of Crime Causation', 3),
('PE-101', 'Marksmanship and Defensive Tactics', 2),
('GE-01', 'Understanding the Self', 3),
('STEM-121', 'General Physics 2', 4),
('STEM-122', 'General Chemistry 2', 4),
('STEM-123', 'Basic Calculus', 3),
('COR-09', 'Physical Education and Health 3', 2),
('HM-401', 'International Cuisine and Gastronomy', 3),
('HM-402', 'Front Office Systems Simulation (Opera PMS)', 3),
('HM-403', 'Events Management and Catering Operations', 3),
('HM-404', 'Practicum and Internship Seminar', 3);

-- Darlyn Jhane
INSERT INTO `student` (`IDNo`, `LRN`, `STUDENT_NUMBER`, `FIRSTNAME`, `LASTNAME`, `COURSE`, `DEPARTMENT`, `YEAR_LEVEL`, `SECTION`, `CONTACTNo`, `EMAIL`, `GUARDIAN_NAME`, `GUARDIAN_CONTACT`, `ADDRESS`, `ENCODED_BY`) VALUES
(1, '109283746501', 'SNC-2023-0104', 'Darlyn', 'Jhane', 'BS Information Technology', 'College of Computer Studies', '3rd Year', 'BSIT 3-A', '0917-829-4501', 'djhane@snc.edu.ph', 'Eduardo Jhane', '0918-554-1234', 'Brgy. Dolores, City of San Fernando, Pampanga', 1);
INSERT INTO `assessment` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `TUITION_FEE`, `LAB_FEE`, `MISC_FEE`, `PREVIOUS_BALANCE`, `ENCODED_BY`) VALUES (1, 1, 1, 16500, 4200, 3800, 0, 1);
INSERT INTO `assessment_item` (`ASSESSMENT_ID`, `ITEM_NAME`, `AMOUNT`, `ITEM_TYPE`) VALUES
(1, 'Computer Lab / Internet Fee', 1500, 'fee'),
(1, 'Supreme Student Council (SSC)', 250, 'fee'),
(1, 'Student Insurance & Red Cross', 200, 'fee'),
(1, 'Athletic & Cultural Fee', 450, 'fee'),
(1, 'Academic Honor Dean''s List (10% Tuition)', 1650, 'discount');
INSERT INTO `student_subject` (`STUDENT_ID`, `PERIOD_ID`, `SUBJECT_ID`, `INSTRUCTOR`, `SCHEDULE`) VALUES
(1, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'IT-311'), 'Prof. Dennis Morales, MIT', 'MW 08:00 - 09:30 AM (ComLab 2)'),
(1, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'IT-312'), 'Engr. Katherine Santos, MSIT', 'TTH 10:00 - 11:30 AM (Room 304)'),
(1, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'IT-313'), 'Prof. Ronald David', 'MW 01:00 - 02:30 PM (ComLab 3)'),
(1, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'IT-314'), 'Prof. Christian Pineda', 'TTH 01:00 - 02:30 PM (ComLab 1)'),
(1, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'GE-08'), 'Dr. Maria Elena Castro', 'F 09:00 - 12:00 PM (AVR 1)');

-- Angelica Mamangun
INSERT INTO `student` (`IDNo`, `LRN`, `STUDENT_NUMBER`, `FIRSTNAME`, `LASTNAME`, `COURSE`, `DEPARTMENT`, `YEAR_LEVEL`, `SECTION`, `CONTACTNo`, `EMAIL`, `GUARDIAN_NAME`, `GUARDIAN_CONTACT`, `ADDRESS`, `ENCODED_BY`) VALUES
(2, '109283746502', 'SNC-2023-0245', 'Angelica', 'Mamangun', 'BS Business Administration', 'College of Business and Accountancy', '2nd Year', 'BSBA 2-B', '0920-412-9844', 'amamangun@snc.edu.ph', 'Luzviminda Mamangun', '0919-876-5432', 'Sindalan, City of San Fernando, Pampanga', 1);
INSERT INTO `assessment` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `TUITION_FEE`, `LAB_FEE`, `MISC_FEE`, `PREVIOUS_BALANCE`, `ENCODED_BY`) VALUES (2, 2, 1, 14500, 1200, 3600, 1200, 1);
INSERT INTO `assessment_item` (`ASSESSMENT_ID`, `ITEM_NAME`, `AMOUNT`, `ITEM_TYPE`) VALUES
(2, 'Business Lab Simulation', 800, 'fee'),
(2, 'Supreme Student Council', 250, 'fee'),
(2, 'Student Insurance', 200, 'fee');
INSERT INTO `student_subject` (`STUDENT_ID`, `PERIOD_ID`, `SUBJECT_ID`, `INSTRUCTOR`, `SCHEDULE`) VALUES
(2, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'BA-201'), 'Prof. Grace Villanueva, CPA', 'MW 09:30 - 11:00 AM (Room 201)'),
(2, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'BA-202'), 'Prof. Jonathan Dizon', 'TTH 08:00 - 09:30 AM (Room 204)'),
(2, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'BA-203'), 'Dr. Ramon Bautista', 'TTH 01:00 - 02:30 PM (Room 203)'),
(2, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'GE-05'), 'Prof. Mary Ann Cruz', 'MW 01:00 - 02:30 PM (Room 105)');

-- Rio Feliciano
INSERT INTO `student` (`IDNo`, `LRN`, `STUDENT_NUMBER`, `FIRSTNAME`, `LASTNAME`, `COURSE`, `DEPARTMENT`, `YEAR_LEVEL`, `SECTION`, `CONTACTNo`, `EMAIL`, `GUARDIAN_NAME`, `GUARDIAN_CONTACT`, `ADDRESS`, `ENCODED_BY`) VALUES
(3, '109283746503', 'SNC-2024-0089', 'Rio', 'Feliciano', 'BS Criminology', 'College of Criminal Justice Education', '1st Year', 'BSCrim 1-C', '0945-312-7788', 'rfeliciano@snc.edu.ph', 'Rolando Feliciano', '0930-112-9988', 'San Agustin, San Fernando, Pampanga', 1);
INSERT INTO `assessment` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `TUITION_FEE`, `LAB_FEE`, `MISC_FEE`, `PREVIOUS_BALANCE`, `ENCODED_BY`) VALUES (3, 3, 1, 15800, 3500, 3900, 0, 1);
INSERT INTO `assessment_item` (`ASSESSMENT_ID`, `ITEM_NAME`, `AMOUNT`, `ITEM_TYPE`) VALUES
(3, 'Criminology Uniform / Badge Fee', 1800, 'fee'),
(3, 'Defensive Tactics / Physical Defense', 1200, 'fee'),
(3, 'Supreme Student Council', 250, 'fee');
INSERT INTO `student_subject` (`STUDENT_ID`, `PERIOD_ID`, `SUBJECT_ID`, `INSTRUCTOR`, `SCHEDULE`) VALUES
(3, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'CRIM-101'), 'Atty. Victoriano Guinto', 'MWF 07:30 - 08:30 AM (Room 101)'),
(3, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'CRIM-102'), 'Capt. Noel Manalang, MSCrim', 'TTH 09:00 - 10:30 AM (Room 102)'),
(3, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'PE-101'), 'Coach Dante Mallari', 'Sat 08:00 - 10:00 AM (Gymnasium)'),
(3, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'GE-01'), 'Prof. Rowena Tolentino', 'MWF 10:30 - 11:30 AM (Room 104)');

-- Yves Tapnio
INSERT INTO `student` (`IDNo`, `LRN`, `STUDENT_NUMBER`, `FIRSTNAME`, `LASTNAME`, `COURSE`, `DEPARTMENT`, `YEAR_LEVEL`, `SECTION`, `CONTACTNo`, `EMAIL`, `GUARDIAN_NAME`, `GUARDIAN_CONTACT`, `ADDRESS`, `ENCODED_BY`) VALUES
(4, '109283746504', 'SNC-SHS-2023-091', 'Yves', 'Tapnio', 'Senior High School - STEM Strand', 'Basic Education Department', 'Grade 12', 'STEM 12-A', '0915-778-9012', 'ytapnio@snc.edu.ph', 'Marilou Tapnio', '0922-345-6789', 'Telabastagan, City of San Fernando, Pampanga', 1);
INSERT INTO `assessment` (`IDNo`, `STUDENT_ID`, `PERIOD_ID`, `TUITION_FEE`, `LAB_FEE`, `MISC_FEE`, `PREVIOUS_BALANCE`, `ENCODED_BY`) VALUES (4, 4, 1, 11000, 2400, 2800, 0, 1);
INSERT INTO `assessment_item` (`ASSESSMENT_ID`, `ITEM_NAME`, `AMOUNT`, `ITEM_TYPE`) VALUES
(4, 'DepEd Voucher Subsidy Applied', 0, 'fee'),
(4, 'Science Laboratory Kit', 650, 'fee'),
(4, 'Student Handbook & ID', 350, 'fee'),
(4, 'DepEd Senior High School Voucher', 8000, 'discount');
INSERT INTO `student_subject` (`STUDENT_ID`, `PERIOD_ID`, `SUBJECT_ID`, `INSTRUCTOR`, `SCHEDULE`) VALUES
(4, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'STEM-121'), 'Sir Arnel Guinto', 'MWF 08:00 - 09:30 AM (SciLab 1)'),
(4, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'STEM-122'), 'Maam Jennifer David', 'TTH 10:00 - 12:00 PM (SciLab 2)'),
(4, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'STEM-123'), 'Sir Michael Ocampo', 'MWF 01:00 - 02:00 PM (Room 402)'),
(4, 1, (SELECT `IDNo` FROM `subject` WHERE `CODE` = 'COR-09'), 'Coach Alvin Bondoc', 'Sat 09:00 - 11:00 AM (Quadrangle)');

-- Link subjects to courses (GE subjects have no link = all courses)
INSERT INTO `subject_course` (`SUBJECT_ID`, `COURSE_ID`)
SELECT s.`IDNo`, c.`IDNo` FROM `subject` s JOIN `course` c ON
     (c.`CODE` = 'BSBA' AND s.`CODE` LIKE 'BA-%')
  OR (c.`CODE` = 'BSCRIM' AND (s.`CODE` LIKE 'CRIM-%' OR s.`CODE` = 'PE-101'))
  OR (c.`CODE` = 'BSHM' AND s.`CODE` LIKE 'HM-%')
  OR (c.`CODE` = 'BSIT' AND s.`CODE` LIKE 'IT-%')
  OR (c.`CODE` = 'SHS-STEM' AND (s.`CODE` LIKE 'STEM-%' OR s.`CODE` = 'COR-09'));
