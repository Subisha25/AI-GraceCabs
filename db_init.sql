CREATE DATABASE IF NOT EXISTS `new_ai_cabs_db`;
USE `new_ai_cabs_db`;

/* Disable foreign key checks for clean table drops and creations */
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `booking`;
DROP TABLE IF EXISTS `booking_sequence`;
DROP TABLE IF EXISTS `closependings`;
DROP TABLE IF EXISTS `company`;
DROP TABLE IF EXISTS `configuration`;
DROP TABLE IF EXISTS `drivers`;
DROP TABLE IF EXISTS `emailconfiguration`;
DROP TABLE IF EXISTS `employee`;
DROP TABLE IF EXISTS `invoice`;
DROP TABLE IF EXISTS `invoice_sequences`;
DROP TABLE IF EXISTS `mapcount`;
DROP TABLE IF EXISTS `monthly_invoice`;
DROP TABLE IF EXISTS `monthly_invoice_items`;
DROP TABLE IF EXISTS `monthlybookingsequence`;
DROP TABLE IF EXISTS `oncallinvoice`;
DROP TABLE IF EXISTS `oncallinvoiceitems`;
DROP TABLE IF EXISTS `ordersummery`;
DROP TABLE IF EXISTS `otp`;
DROP TABLE IF EXISTS `package`;
DROP TABLE IF EXISTS `packagedata`;
DROP TABLE IF EXISTS `partners`;
DROP TABLE IF EXISTS `payment`;
DROP TABLE IF EXISTS `payment_sequence`;
DROP TABLE IF EXISTS `paymentmode`;
DROP TABLE IF EXISTS `pickuparea`;
DROP TABLE IF EXISTS `pickupcity`;
DROP TABLE IF EXISTS `short_links`;
DROP TABLE IF EXISTS `tax`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `vehicle`;
DROP TABLE IF EXISTS `vehiclemaster`;
DROP TABLE IF EXISTS `vehicletype`;
DROP TABLE IF EXISTS `vendor`;

/* Table structure for table `booking` */
CREATE TABLE `booking` (
  `bookingId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bookingDate` datetime DEFAULT NULL,
  `managerApprovalToken` text COLLATE utf8mb4_unicode_ci,
  `bookingTime` time DEFAULT NULL,
  `signature` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bookingCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `pickupPoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bookingCreatedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `behalfOfName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `behalfOfPhone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupCity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupArea` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `predefinedArea` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropPoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupLongitude` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupLatitude` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropLatitude` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropLongitude` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `travelLatitude` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `travelTrail` json NOT NULL,
  `travelLongitude` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `angle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `travellersCount` int DEFAULT NULL,
  `femaleCount` int DEFAULT NULL,
  `maleCount` int DEFAULT NULL,
  `pickupAirport` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupStation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approximatetds2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approximatetds1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bookingStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driverTripStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `autoApproveStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roundTrip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `paymentId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `driverId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `vehicleMasterId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `costCenter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `selfName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`bookingId`),
  UNIQUE KEY `bookingCode` (`bookingCode`),
  UNIQUE KEY `bookingCode_2` (`bookingCode`),
  KEY `userId` (`userId`),
  KEY `employeeId` (`employeeId`),
  KEY `vehicleId` (`vehicleId`),
  KEY `paymentId` (`paymentId`),
  KEY `vehicleTypeId` (`vehicleTypeId`),
  KEY `driverId` (`driverId`),
  KEY `vehicleMasterId` (`vehicleMasterId`),
  KEY `managerUserId` (`managerUserId`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`employeeId`) REFERENCES `employee` (`employeeId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_3` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle` (`vehicleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_4` FOREIGN KEY (`paymentId`) REFERENCES `payment` (`paymentId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_5` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicletype` (`vehicleTypeId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_6` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`driverId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_7` FOREIGN KEY (`vehicleMasterId`) REFERENCES `vehiclemaster` (`vehicleMasterId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_8` FOREIGN KEY (`managerUserId`) REFERENCES `user` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_ibfk_9` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `booking_sequence` */
CREATE TABLE `booking_sequence` (
  `seq_date` date NOT NULL,
  `last_number` int DEFAULT NULL,
  PRIMARY KEY (`seq_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `closependings` */
CREATE TABLE `closependings` (
  `closependingId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `pickupDate` datetime NOT NULL,
  `garageKms` int DEFAULT '0',
  `usageHours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `garageOpenKm` int DEFAULT NULL,
  `garageCloseKm` int DEFAULT NULL,
  `garageOpenDateTime` datetime DEFAULT NULL,
  `garageCloseDateTime` datetime DEFAULT NULL,
  `guestKms` int DEFAULT '0',
  `guestOpenKm` int DEFAULT NULL,
  `guestCloseKm` int DEFAULT NULL,
  `guestOpenDateTime` datetime DEFAULT NULL,
  `guestCloseDateTime` datetime DEFAULT NULL,
  `hideGuestDetails` tinyint(1) DEFAULT '0',
  `packageDataId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `extraDriverBeta` decimal(10,2) DEFAULT '0.00',
  `driverBetaDays` int DEFAULT '0',
  `chargesTitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chargesRemarks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraChargesBreakup` json DEFAULT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `additionalKms` int DEFAULT '0',
  `additionalHours` int DEFAULT '0',
  `discountAmount` decimal(10,2) DEFAULT '0.00',
  `advanceAmount` decimal(10,2) DEFAULT '0.00',
  `cgstApplicable` tinyint(1) DEFAULT '0',
  `igstApplicable` tinyint(1) DEFAULT '0',
  `sgstApplicable` tinyint(1) DEFAULT '0',
  `packageAmount` decimal(10,2) DEFAULT '0.00',
  `additionalKmsAmount` decimal(10,2) DEFAULT '0.00',
  `additionalHoursAmount` decimal(10,2) DEFAULT '0.00',
  `totalAmount` decimal(10,2) DEFAULT '0.00',
  `extraCharges` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT '0.00',
  `totalDue` decimal(10,2) DEFAULT '0.00',
  `cgstAmount` decimal(10,2) DEFAULT '0.00',
  `igstAmount` decimal(10,2) DEFAULT '0.00',
  `sgstAmount` decimal(10,2) DEFAULT '0.00',
  `totalTaxAmount` decimal(10,2) DEFAULT '0.00',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `tripSheetNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selectedPackageData` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`closependingId`),
  KEY `packageDataId` (`packageDataId`),
  CONSTRAINT `closependings_ibfk_1` FOREIGN KEY (`packageDataId`) REFERENCES `packagedata` (`packageDataId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `company` */
CREATE TABLE `company` (
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `companyName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyPhno` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `domainName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seoUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gstNo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerEmail` text COLLATE utf8mb4_unicode_ci,
  `managerApproval` tinyint(1) DEFAULT '0',
  `allowTax` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `needEmail` tinyint(1) DEFAULT '0',
  `companyLogo` text COLLATE utf8mb4_unicode_ci,
  `companyAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startTime` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closeTime` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priorMinutes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`companyId`),
  KEY `userId` (`userId`),
  KEY `employeeId` (`employeeId`),
  CONSTRAINT `company_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `company_ibfk_2` FOREIGN KEY (`employeeId`) REFERENCES `employee` (`employeeId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `configuration` */
CREATE TABLE `configuration` (
  `configId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `serviceTaxPercentage` float DEFAULT NULL,
  `dueDays` int DEFAULT NULL,
  `invoiceNoStartingFrom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelBookingHours` int DEFAULT NULL,
  `invoiceNoPrefix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtpServer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtpEmailAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtpEmailPassword` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtpEmailPort` int DEFAULT NULL,
  `outstationHasTax` tinyint(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`configId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `drivers` */
CREATE TABLE `drivers` (
  `driverId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `driverName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driverEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phno` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `licenseNo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `licExpDate` datetime DEFAULT NULL,
  `otp` int DEFAULT NULL,
  `ratings` int DEFAULT NULL,
  `trackLocation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingsource` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`driverId`),
  UNIQUE KEY `phno` (`phno`),
  UNIQUE KEY `phno_2` (`phno`),
  KEY `vehicleId` (`vehicleId`),
  KEY `vehicleTypeId` (`vehicleTypeId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `drivers_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle` (`vehicleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `drivers_ibfk_2` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicletype` (`vehicleTypeId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `drivers_ibfk_3` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`employeeId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `emailconfiguration` */
CREATE TABLE `emailconfiguration` (
  `emailConfigId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emailCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci,
  `fromName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emailBcc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`emailConfigId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `employee` */
CREATE TABLE `employee` (
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empManager` tinyint(1) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phno` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`employeeId`),
  UNIQUE KEY `phno` (`phno`),
  UNIQUE KEY `phno_2` (`phno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `invoice` */
CREATE TABLE `invoice` (
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `invoiceNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `invoiceAmount` int DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `bookingId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `closePendingId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `paymentId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `monthlyInvoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`invoiceId`),
  UNIQUE KEY `invoiceNumber` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_2` (`invoiceNumber`),
  KEY `userId` (`userId`),
  KEY `vendorId` (`vendorId`),
  KEY `vehicleTypeId` (`vehicleTypeId`),
  KEY `bookingId` (`bookingId`),
  KEY `closePendingId` (`closePendingId`),
  KEY `companyId` (`companyId`),
  KEY `paymentId` (`paymentId`),
  KEY `monthlyInvoiceId` (`monthlyInvoiceId`),
  CONSTRAINT `invoice_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_2` FOREIGN KEY (`vendorId`) REFERENCES `vendor` (`vendorId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_3` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicletype` (`vehicleTypeId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_4` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`bookingId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_5` FOREIGN KEY (`closePendingId`) REFERENCES `closependings` (`closependingId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_6` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_7` FOREIGN KEY (`paymentId`) REFERENCES `payment` (`paymentId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ibfk_8` FOREIGN KEY (`monthlyInvoiceId`) REFERENCES `monthly_invoice` (`monthlyInvoiceId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `invoice_sequences` */
CREATE TABLE `invoice_sequences` (
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `financialYear` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current` int DEFAULT '0',
  PRIMARY KEY (`companyId`,`financialYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `mapcount` */
CREATE TABLE `mapcount` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `appCount` int DEFAULT '0',
  `webCount` int DEFAULT '0',
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `monthly_invoice` */
CREATE TABLE `monthly_invoice` (
  `monthlyInvoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `monthlyBookingCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceDate` date NOT NULL,
  `invoiceMonth` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `companyName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vehicleTypeName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleNumber` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `packageDataId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `packageDetails` json DEFAULT NULL,
  `extraKm` double NOT NULL DEFAULT '0',
  `extraDays` double NOT NULL DEFAULT '0',
  `extraChargeType` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'toll',
  `extraChargesInputAmount` double NOT NULL DEFAULT '0',
  `discount` double NOT NULL DEFAULT '0',
  `advance` double NOT NULL DEFAULT '0',
  `packageAmount` double NOT NULL DEFAULT '0',
  `extraKmAmount` double NOT NULL DEFAULT '0',
  `extraDaysAmount` double NOT NULL DEFAULT '0',
  `extraHrs` double NOT NULL DEFAULT '0',
  `extraHourRate` double NOT NULL DEFAULT '0',
  `extraHrsAmount` double NOT NULL DEFAULT '0',
  `netTotal` double NOT NULL DEFAULT '0',
  `extraCharges` json DEFAULT NULL,
  `taxes` json DEFAULT NULL,
  `totalTaxAmount` double NOT NULL DEFAULT '0',
  `finalTotal` double NOT NULL DEFAULT '0',
  `closeStatus` int NOT NULL DEFAULT '0',
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `balanceDue` double NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`monthlyInvoiceId`),
  UNIQUE KEY `monthlyBookingCode` (`monthlyBookingCode`),
  UNIQUE KEY `monthlyBookingCode_2` (`monthlyBookingCode`),
  KEY `companyId` (`companyId`),
  KEY `invoiceId` (`invoiceId`),
  CONSTRAINT `monthly_invoice_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `monthly_invoice_ibfk_2` FOREIGN KEY (`invoiceId`) REFERENCES `invoice` (`invoiceId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `monthly_invoice_items` */
CREATE TABLE `monthly_invoice_items` (
  `monthlyInvoiceItemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `monthlyInvoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `route` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vehicleTypeName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `packageDataId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `packageDetails` json DEFAULT NULL,
  `packageAmount` double NOT NULL DEFAULT '0',
  `extraKm` double NOT NULL DEFAULT '0',
  `extraKmAmount` double NOT NULL DEFAULT '0',
  `extraDays` double NOT NULL DEFAULT '0',
  `extraDaysAmount` double NOT NULL DEFAULT '0',
  `extraHrs` double NOT NULL DEFAULT '0',
  `extraHourRate` double NOT NULL DEFAULT '0',
  `extraHrsAmount` double NOT NULL DEFAULT '0',
  `extraChargeType` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'toll',
  `extraChargesInputAmount` double NOT NULL DEFAULT '0',
  `extraCharges` json DEFAULT NULL,
  `discount` double NOT NULL DEFAULT '0',
  `advance` double NOT NULL DEFAULT '0',
  `netTotal` double NOT NULL DEFAULT '0',
  `taxes` json DEFAULT NULL,
  `totalTaxAmount` double NOT NULL DEFAULT '0',
  `finalTotal` double NOT NULL DEFAULT '0',
  `balanceDue` double NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`monthlyInvoiceItemId`),
  KEY `monthlyInvoiceId` (`monthlyInvoiceId`),
  CONSTRAINT `monthly_invoice_items_ibfk_1` FOREIGN KEY (`monthlyInvoiceId`) REFERENCES `monthly_invoice` (`monthlyInvoiceId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `monthlybookingsequence` */
CREATE TABLE `monthlybookingsequence` (
  `financialYear` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyCode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastNumber` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`financialYear`,`companyCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `oncallinvoice` */
CREATE TABLE `oncallinvoice` (
  `onCallBillId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `onCallInvoiceCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `companyName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tripSheetNumbers` text COLLATE utf8mb4_unicode_ci,
  `totalAmount` decimal(18,2) DEFAULT NULL,
  `totalTaxAmount` text COLLATE utf8mb4_unicode_ci,
  `invoiceSubTotal` decimal(18,2) DEFAULT NULL,
  `invoiceTaxBreakup` text COLLATE utf8mb4_unicode_ci,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`onCallBillId`),
  UNIQUE KEY `onCallInvoiceCode` (`onCallInvoiceCode`),
  UNIQUE KEY `onCallInvoiceCode_2` (`onCallInvoiceCode`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `oncallinvoice_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `oncallinvoiceitems` */
CREATE TABLE `oncallinvoiceitems` (
  `onCallInvoiceItemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `onCallBillId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `tripSheetNo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `vehicleTypeId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleNo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driverName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guestName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bookedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tripDetails` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `garageOpenKm` float DEFAULT NULL,
  `garageCloseKm` float DEFAULT NULL,
  `garageKms` float DEFAULT NULL,
  `guestOpenKm` float DEFAULT NULL,
  `guestCloseKm` float DEFAULT NULL,
  `guestKms` float DEFAULT NULL,
  `hideGuestDetails` tinyint(1) DEFAULT NULL,
  `startingTime` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closingTime` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usageHours` float DEFAULT NULL,
  `packageType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `travelPackage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `packageDays` int DEFAULT NULL,
  `driverDays` int DEFAULT NULL,
  `selectedPackageMeta` text COLLATE utf8mb4_unicode_ci,
  `packageAmount` decimal(18,2) DEFAULT NULL,
  `additionalKms` float DEFAULT NULL,
  `additionalKmsAmount` decimal(18,2) DEFAULT NULL,
  `additionalHours` float DEFAULT NULL,
  `additionalHoursAmount` decimal(18,2) DEFAULT NULL,
  `driverBatta` decimal(18,2) DEFAULT NULL,
  `extraChargesBreakup` text COLLATE utf8mb4_unicode_ci,
  `extraCharges` decimal(18,2) DEFAULT NULL,
  `discountAmount` decimal(18,2) DEFAULT NULL,
  `advanceAmount` decimal(18,2) DEFAULT NULL,
  `taxes` text COLLATE utf8mb4_unicode_ci,
  `totalTaxAmount` decimal(18,2) DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT NULL,
  `total` decimal(18,2) DEFAULT NULL,
  `totalDue` decimal(18,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`onCallInvoiceItemId`),
  KEY `onCallBillId` (`onCallBillId`),
  CONSTRAINT `oncallinvoiceitems_ibfk_1` FOREIGN KEY (`onCallBillId`) REFERENCES `oncallinvoice` (`onCallBillId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `ordersummery` */
CREATE TABLE `ordersummery` (
  `ordersummeryid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `taxId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`ordersummeryid`),
  KEY `companyId` (`companyId`),
  KEY `invoiceId` (`invoiceId`),
  KEY `taxId` (`taxId`),
  CONSTRAINT `ordersummery_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ordersummery_ibfk_2` FOREIGN KEY (`invoiceId`) REFERENCES `invoice` (`invoiceId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ordersummery_ibfk_3` FOREIGN KEY (`taxId`) REFERENCES `tax` (`taxId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `otp` */
CREATE TABLE `otp` (
  `otpId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `otp` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loginId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sessionId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`otpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `package` */
CREATE TABLE `package` (
  `packageId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `packageType` enum('Out Station','Local City Use') COLLATE utf8mb4_unicode_ci NOT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`packageId`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `package_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `packagedata` */
CREATE TABLE `packagedata` (
  `packageDataId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `packageType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `packages` longtext COLLATE utf8mb4_unicode_ci,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`packageDataId`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `packagedata_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `partners` */
CREATE TABLE `partners` (
  `partnerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityPreferred` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `licenseNo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrationNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrationYear` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuelType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passengerCapacity` int DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`partnerId`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contactNumber` (`contactNumber`),
  UNIQUE KEY `licenseNo` (`licenseNo`),
  UNIQUE KEY `registrationNumber` (`registrationNumber`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `contactNumber_2` (`contactNumber`),
  UNIQUE KEY `licenseNo_2` (`licenseNo`),
  UNIQUE KEY `registrationNumber_2` (`registrationNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `payment` */
CREATE TABLE `payment` (
  `paymentId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `paymentMode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isOnline` tinyint(1) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL,
  `transactionId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,0) DEFAULT NULL,
  `tax` decimal(10,0) DEFAULT NULL,
  `orderId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gatewayOrderId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clientAuthToken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`paymentId`),
  UNIQUE KEY `transactionId` (`transactionId`),
  UNIQUE KEY `transactionId_2` (`transactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `payment_sequence` */
CREATE TABLE `payment_sequence` (
  `seq_date` date NOT NULL,
  `last_number` int DEFAULT NULL,
  PRIMARY KEY (`seq_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `paymentmode` */
CREATE TABLE `paymentmode` (
  `paymentmodeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `modelname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortorder` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isOnline` tinyint(1) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`paymentmodeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `pickuparea` */
CREATE TABLE `pickuparea` (
  `areaId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `pickupCity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupArea` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`areaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `pickupcity` */
CREATE TABLE `pickupcity` (
  `cityId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickupCity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isPickupCity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`cityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `short_links` */
CREATE TABLE `short_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullUrl` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL COMMENT 'If set, short link expires at this time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `short_links_code` (`code`),
  UNIQUE KEY `code_2` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `tax` */
CREATE TABLE `tax` (
  `taxId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `taxName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxPercent` double DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`taxId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `user` */
CREATE TABLE `user` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `danfossuserId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isManager` tinyint(1) DEFAULT NULL,
  `companyManager` tinyint(1) DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedManagerById` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('active','inactive','suspended','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `presentAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pinCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isPayHolder` tinyint(1) NOT NULL DEFAULT '0',
  `costCenter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `isConfirmed` tinyint(1) NOT NULL DEFAULT '0',
  `addresses` json DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`userId`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `vehicle` */
CREATE TABLE `vehicle` (
  `vehicleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vehicleName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `manufacturing` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleImg` json DEFAULT NULL,
  `availableStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  KEY `vehicleTypeId` (`vehicleTypeId`),
  CONSTRAINT `vehicle_ibfk_1` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicletype` (`vehicleTypeId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `vehiclemaster` */
CREATE TABLE `vehiclemaster` (
  `vehicleMasterId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vehicleNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vehicleModelName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vehicleType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `isDeleted` int DEFAULT '0',
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`vehicleMasterId`),
  KEY `vehicleId` (`vehicleId`),
  KEY `vehicleTypeId` (`vehicleTypeId`),
  KEY `vendorId` (`vendorId`),
  CONSTRAINT `vehiclemaster_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle` (`vehicleId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vehiclemaster_ibfk_2` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicletype` (`vehicleTypeId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `vehiclemaster_ibfk_3` FOREIGN KEY (`vendorId`) REFERENCES `vendor` (`vendorId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `vehicletype` */
CREATE TABLE `vehicletype` (
  `vehicleTypeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vehicleType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleImg` json DEFAULT NULL,
  `AdvanceBookingHours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seatCapacity` int DEFAULT NULL,
  `priorMinutes` int NOT NULL DEFAULT '0',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `bookingType` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`vehicleTypeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Table structure for table `vendor` */
CREATE TABLE `vendor` (
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phno` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleCount` int DEFAULT NULL,
  `refererVendor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`vendorId`),
  UNIQUE KEY `phno` (`phno`),
  UNIQUE KEY `phno_2` (`phno`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `vendor_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `employee` (`employeeId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Enable foreign key checks back */
SET FOREIGN_KEY_CHECKS = 1;

/* Safe development seed data */
/* Seed Employee (Super Admin) */
INSERT INTO `employee` (`employeeId`, `username`, `email`, `phno`, `password`, `role`, `isDeleted`, `createdAt`) VALUES
('e4544d0d-2e65-4d7a-85d1-125035feee1a', 'Admin User', 'admin@local.platform', '9999999999', '$2b$10$nF4bM7yF2rS3XoGqLdKmPe8Bq.V/L5Bpy6z4zG1N3D2PjC7/uPjD2', 'superadmin', 0, NOW());

/* Seed Tax defaults */
INSERT INTO `tax` (`taxId`, `taxName`, `taxPercentage`, `createdAt`) VALUES
('t4544d0d-2e65-4d7a-85d1-125035feee1b', 'CGST', 2.5, NOW()),
('t4544d0d-2e65-4d7a-85d1-125035feee1c', 'SGST', 2.5, NOW());

/* Seed Payment Modes */
INSERT INTO `paymentmode` (`paymentmodeId`, `paymentmodeName`, `isDeleted`, `createdAt`) VALUES
('pm4544d0-2e65-4d7a-85d1-125035feee1d', 'Cash', 0, NOW()),
('pm4544d0-2e65-4d7a-85d1-125035feee1e', 'UPI', 0, NOW()),
('pm4544d0-2e65-4d7a-85d1-125035feee1f', 'Card', 0, NOW()),
('pm4544d0-2e65-4d7a-85d1-125035feee20', 'Corporate Billing', 0, NOW());

/* Seed Configuration */
INSERT INTO `configuration` (`configId`, `keyName`, `keyValue`, `createdAt`) VALUES
('c4544d0d-2e65-4d7a-85d1-125035feee21', 'COMPANY_NAME', 'New Local AI Mobility Platform', NOW()),
('c4544d0d-2e65-4d7a-85d1-125035feee22', 'COMPANY_EMAIL', 'admin@local.platform', NOW());
