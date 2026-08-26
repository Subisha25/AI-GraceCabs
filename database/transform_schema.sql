-- SQL Multi-Tenant SaaS Schema Transformation
-- Database: new_ai_cabs_db

-- Disable foreign key constraints during table modifications
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create fleet_operator table
DROP TABLE IF EXISTS `new_ai_cabs_db`.`fleet_operator`;
CREATE TABLE IF NOT EXISTS `new_ai_cabs_db`.`fleet_operator` (
  `operatorId` CHAR(36) NOT NULL,
  `operatorName` VARCHAR(255) NOT NULL,
  `contactEmail` VARCHAR(255) NOT NULL,
  `contactPhone` VARCHAR(50) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`operatorId`),
  UNIQUE INDEX `operator_email_unique` (`contactEmail` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insert default fleet operator
INSERT INTO `new_ai_cabs_db`.`fleet_operator` (`operatorId`, `operatorName`, `contactEmail`, `contactPhone`, `status`)
VALUES ('e111111d-2e65-4d7a-85d1-125035feee1a', 'Default Transport Operator', 'operator@local.platform', '9999999999', 'active')
ON DUPLICATE KEY UPDATE operatorName='Default Transport Operator';

-- 3. Add operatorId column to existing tables if not exists
DROP PROCEDURE IF EXISTS AddOperatorColumn;
DELIMITER //

CREATE PROCEDURE AddOperatorColumn(IN tableName VARCHAR(255))
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'new_ai_cabs_db' AND TABLE_NAME = tableName AND COLUMN_NAME = 'operatorId'
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `new_ai_cabs_db`.`', tableName, '` ADD COLUMN `operatorId` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT "e111111d-2e65-4d7a-85d1-125035feee1a", ADD CONSTRAINT `fk_', tableName, '_operator` FOREIGN KEY (`operatorId`) REFERENCES `fleet_operator` (`operatorId`) ON DELETE CASCADE ON UPDATE CASCADE;');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
  
  -- Update any null operatorId values to default operator
  SET @update_query = CONCAT('UPDATE `new_ai_cabs_db`.`', tableName, '` SET `operatorId` = "e111111d-2e65-4d7a-85d1-125035feee1a" WHERE `operatorId` IS NULL;');
  PREPARE stmt_up FROM @update_query;
  EXECUTE stmt_up;
  DEALLOCATE PREPARE stmt_up;
END //

DELIMITER ;

CALL AddOperatorColumn('employee');
CALL AddOperatorColumn('company');
CALL AddOperatorColumn('user');
CALL AddOperatorColumn('drivers');
CALL AddOperatorColumn('vendor');
CALL AddOperatorColumn('partners');
CALL AddOperatorColumn('vehiclemaster');
CALL AddOperatorColumn('vehicle');
CALL AddOperatorColumn('package');
CALL AddOperatorColumn('packagedata');
CALL AddOperatorColumn('booking');
CALL AddOperatorColumn('invoice');
CALL AddOperatorColumn('monthly_invoice');
CALL AddOperatorColumn('oncallinvoice');

DROP PROCEDURE AddOperatorColumn;

-- 4. Create organization_package table
CREATE TABLE IF NOT EXISTS `new_ai_cabs_db`.`organization_package` (
  `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `operatorId` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `packageId` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customBaseAmount` DECIMAL(10,2) NULL,
  `customExtraKmRate` DECIMAL(10,2) NULL,
  `customExtraHourRate` DECIMAL(10,2) NULL,
  `effectiveDate` DATE NULL,
  `expiryDate` DATE NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_org_package_operator` FOREIGN KEY (`operatorId`) REFERENCES `fleet_operator` (`operatorId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_org_package_company` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_org_package_pack` FOREIGN KEY (`packageId`) REFERENCES `package` (`packageId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create booking_passenger table
CREATE TABLE IF NOT EXISTS `new_ai_cabs_db`.`booking_passenger` (
  `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bookingId` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `passengerName` VARCHAR(255) NOT NULL,
  `passengerPhone` VARCHAR(50) NULL,
  `passengerEmail` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_booking_passenger_book` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`bookingId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Add bookingType and companyId scoping to booking if not exists
DROP PROCEDURE IF EXISTS AddBookingColumns;
DELIMITER //

CREATE PROCEDURE AddBookingColumns()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'new_ai_cabs_db' AND TABLE_NAME = 'booking' AND COLUMN_NAME = 'bookingType'
  ) THEN
    ALTER TABLE `new_ai_cabs_db`.`booking` ADD COLUMN `bookingType` VARCHAR(50) NOT NULL DEFAULT 'ORGANIZATION';
  END IF;
END //

DELIMITER ;
CALL AddBookingColumns();
DROP PROCEDURE AddBookingColumns;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;
