-- Lets a student deposit a self-service kiosk payment as account credit instead of
-- applying it to a term due, then later request to withdraw it (cashed out at the
-- Cashier after Accounting releases the request). Does NOT delete data. Run once.
USE `kiosk_permit`;

ALTER TABLE `payment`
  ADD COLUMN `IS_DEPOSIT` tinyint(1) NOT NULL DEFAULT 0
    COMMENT 'Held as account credit instead of applied to a term due; see withdrawal_request'
    AFTER `PAYMENT_DT`;

CREATE TABLE IF NOT EXISTS `withdrawal_request` (
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
