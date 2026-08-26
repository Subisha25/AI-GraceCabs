-- SQL Database Migration Script
-- SOURCE: vehiclemanagement
-- TARGET: new_ai_cabs_db
-- 
-- DESCRIPTION: Copies the configuration and master lookup data from vehiclemanagement to new_ai_cabs_db.
--              Does NOT touch or write to the source database.
--              Bypasses foreign key checks during import to resolve circular references.
--              Excludes historical transactional records like booking/invoice/payment logs.

-- Disable foreign key constraints during copy
SET FOREIGN_KEY_CHECKS = 0;

-- 1. configuration
TRUNCATE TABLE new_ai_cabs_db.configuration;
INSERT INTO new_ai_cabs_db.configuration (configId, serviceTaxPercentage, dueDays, invoiceNoStartingFrom, cancelBookingHours, invoiceNoPrefix, smtpServer, smtpEmailAddress, smtpEmailPassword, smtpEmailPort, outstationHasTax, createdAt, updatedAt)
SELECT configId, serviceTaxPercentage, dueDays, invoiceNoStartingFrom, cancelBookingHours, invoiceNoPrefix, smtpServer, smtpEmailAddress, smtpEmailPassword, smtpEmailPort, outstationHasTax, createdAt, updatedAt FROM vehiclemanagement.configuration;

-- 2. paymentmode
TRUNCATE TABLE new_ai_cabs_db.paymentmode;
INSERT INTO new_ai_cabs_db.paymentmode (paymentmodeId, modelname, sortorder, isOnline, isActive, isDeleted, createdAt)
SELECT paymentmodeId, modelname, sortorder, isOnline, isActive, isDeleted, createdAt FROM vehiclemanagement.paymentmode;

-- 3. tax
TRUNCATE TABLE new_ai_cabs_db.tax;
INSERT INTO new_ai_cabs_db.tax (taxId, taxName, taxPercent, isActive, createdAt)
SELECT taxId, taxName, taxPercent, isActive, createdAt FROM vehiclemanagement.tax;

-- 4. pickupcity
TRUNCATE TABLE new_ai_cabs_db.pickupcity;
INSERT INTO new_ai_cabs_db.pickupcity (cityId, country, state, pickupCity, sortOrder, isPickupCity, isDeleted, createdAt)
SELECT cityId, country, state, pickupCity, sortOrder, isPickupCity, isDeleted, createdAt FROM vehiclemanagement.pickupcity;

-- 5. pickuparea
TRUNCATE TABLE new_ai_cabs_db.pickuparea;
INSERT INTO new_ai_cabs_db.pickuparea (areaId, pickupCity, pickupArea, isDeleted, createdAt)
SELECT areaId, pickupCity, pickupArea, isDeleted, createdAt FROM vehiclemanagement.pickuparea;

-- 6. vehicletype
TRUNCATE TABLE new_ai_cabs_db.vehicletype;
INSERT INTO new_ai_cabs_db.vehicletype (vehicleTypeId, vehicleType, vehicleImg, AdvanceBookingHours, seatCapacity, priorMinutes, isDeleted, bookingType, createdAt)
SELECT vehicleTypeId, vehicleType, vehicleImg, AdvanceBookingHours, seatCapacity, priorMinutes, isDeleted, bookingType, createdAt FROM vehiclemanagement.vehicletype;

-- 7. emailconfiguration
TRUNCATE TABLE new_ai_cabs_db.emailconfiguration;
INSERT INTO new_ai_cabs_db.emailconfiguration (emailConfigId, title, emailCode, subject, message, fromName, fromAddress, emailBcc, createdAt, updatedAt)
SELECT emailConfigId, title, emailCode, subject, message, fromName, fromAddress, emailBcc, createdAt, updatedAt FROM vehiclemanagement.emailconfiguration;

-- 8. booking_sequence
TRUNCATE TABLE new_ai_cabs_db.booking_sequence;
INSERT INTO new_ai_cabs_db.booking_sequence (seq_date, last_number)
SELECT seq_date, last_number FROM vehiclemanagement.booking_sequence;

-- 9. payment_sequence
TRUNCATE TABLE new_ai_cabs_db.payment_sequence;
INSERT INTO new_ai_cabs_db.payment_sequence (seq_date, last_number)
SELECT seq_date, last_number FROM vehiclemanagement.payment_sequence;

-- 10. invoice_sequences
TRUNCATE TABLE new_ai_cabs_db.invoice_sequences;
INSERT INTO new_ai_cabs_db.invoice_sequences (companyId, financialYear, current)
SELECT companyId, financialYear, current FROM vehiclemanagement.invoice_sequences;

-- 11. monthlybookingsequence (Grouped to avoid primary key duplicates)
TRUNCATE TABLE new_ai_cabs_db.monthlybookingsequence;
INSERT INTO new_ai_cabs_db.monthlybookingsequence (financialYear, companyCode, lastNumber)
SELECT COALESCE(financialYear, '2025-26'), companyCode, MAX(lastNumber)
FROM vehiclemanagement.monthlybookingsequence
WHERE companyCode IS NOT NULL AND companyCode != '' AND financialYear IS NOT NULL
GROUP BY financialYear, companyCode;

-- 12. employee
TRUNCATE TABLE new_ai_cabs_db.employee;
INSERT INTO new_ai_cabs_db.employee (employeeId, username, email, phno, password, role, empManager, fcm_token, createdAt)
SELECT employeeId, username, email, phno, password, role, empManager, fcm_token, createdAt FROM vehiclemanagement.employee;

-- 13. company
TRUNCATE TABLE new_ai_cabs_db.company;
INSERT INTO new_ai_cabs_db.company (companyId, companyName, companyPhno, userId, employeeId, domainName, seoUrl, gstNo, companyCode, managerEmail, managerApproval, allowTax, needEmail, companyLogo, companyAddress, startTime, closeTime, priorMinutes, isDeleted, createdAt)
SELECT companyId, companyName, companyPhno, userId, employeeId, domainName, seoUrl, gstNo, companyCode, managerEmail, managerApproval, allowTax, needEmail, companyLogo, companyAddress, startTime, closeTime, priorMinutes, isDeleted, createdAt FROM vehiclemanagement.company;

-- 14. user
TRUNCATE TABLE new_ai_cabs_db.user;
INSERT INTO new_ai_cabs_db.user (userId, danfossuserId, managerId, managerEmail, username, email, mobile, password, isManager, companyManager, role, approvedManagerById, gender, country, city, fcm_token, companyId, status, presentAddress, pinCode, state, userAddress, isPayHolder, costCenter, isDeleted, isConfirmed, addresses, createdAt)
SELECT userId, danfossuserId, managerId, managerEmail, username, email, mobile, password, isManager, companyManager, role, approvedManagerById, gender, country, city, fcm_token, companyId, status, presentAddress, pinCode, state, userAddress, isPayHolder, costCenter, isDeleted, isConfirmed, addresses, createdAt FROM vehiclemanagement.user;

-- 15. drivers
TRUNCATE TABLE new_ai_cabs_db.drivers;
INSERT INTO new_ai_cabs_db.drivers (driverId, driverName, driverEmail, phno, password, city, state, country, address, pincode, licenseNo, licExpDate, otp, ratings, trackLocation, trackingsource, fcm_token, role, vehicleId, vehicleTypeId, createdBy, isDeleted, createdAt)
SELECT driverId, driverName, driverEmail, phno, password, city, state, country, address, pincode, licenseNo, licExpDate, otp, ratings, trackLocation, trackingsource, fcm_token, role, vehicleId, vehicleTypeId, createdBy, isDeleted, createdAt FROM vehiclemanagement.drivers;

-- 16. vendor
TRUNCATE TABLE new_ai_cabs_db.vendor;
INSERT INTO new_ai_cabs_db.vendor (vendorId, vendorName, phno, email, password, role, isDeleted, createdAt)
SELECT vendorId, vendorName, phno, email, password, role, isDeleted, createdAt FROM vehiclemanagement.vendor;

-- 17. partners
TRUNCATE TABLE new_ai_cabs_db.partners;
INSERT INTO new_ai_cabs_db.partners (partnerId, name, email, contactNumber, presentAddress, registrationNumber, vehicleType, registrationYear, passengerCapacity, fuelType, cityPreferred, isDeleted, createdAt)
SELECT 
  partnerId, 
  name, 
  CASE 
    WHEN partnerId = '44b61342-85d1-44ae-be8a-a58b07dc20d9' THEN 'dhanam+1@gmail.com'
    WHEN partnerId = '75b63069-8a69-423c-82cf-907181bae668' THEN 'dhanam+2@gmail.com'
    WHEN partnerId = '7bd0440e-075d-4a4b-b102-db6df0dd9627' THEN 'dhanam+3@gmail.com'
    WHEN partnerId = 'ed2c645b-6f84-45be-9491-4bd58436ecca' THEN 'dhanam+4@gmail.com'
    ELSE email 
  END, 
  contactNumber, presentAddress, registrationNumber, vehicleType, registrationYear, passengerCapacity, fuelType, cityPreferred, isDeleted, createdAt 
FROM vehiclemanagement.partners;

-- 18. vehiclemaster
TRUNCATE TABLE new_ai_cabs_db.vehiclemaster;
INSERT INTO new_ai_cabs_db.vehiclemaster (vehicleMasterId, vendorId, vehicleNumber, vehicleId, vehicleModelName, vehicleTypeId, vehicleType, vendorName, isDeleted, createdAt)
SELECT vm.vehicleMasterId, vm.vendorId, vm.vehicleNumber, vm.vehicleId, vm.vehicleModelName, vm.vehicleTypeId, vm.vehicleType, vm.vendorName, vm.isDeleted, vm.createdAt 
FROM vehiclemanagement.vehiclemaster vm
INNER JOIN vehiclemanagement.vendor v ON vm.vendorId = v.vendorId;

-- 19. vehicle (Selectively omit deprecated/commented-out columns)
TRUNCATE TABLE new_ai_cabs_db.vehicle;
INSERT INTO new_ai_cabs_db.vehicle (vehicleId, vehicleName, vehicleTypeId, manufacturing, vehicleImg, availableStatus, isDeleted, createdAt)
SELECT vehicleId, vehicleName, vehicleTypeId, manufacturing, vehicleImg, availableStatus, isDeleted, createdAt FROM vehiclemanagement.vehicle;

-- 20. package
TRUNCATE TABLE new_ai_cabs_db.package;
INSERT INTO new_ai_cabs_db.package (packageId, companyId, packageType, isDeleted, createdAt)
SELECT p.packageId, p.companyId, p.packageType, p.isDeleted, p.createdAt 
FROM vehiclemanagement.package p
INNER JOIN vehiclemanagement.company c ON p.companyId = c.companyId;

-- 21. packagedata
TRUNCATE TABLE new_ai_cabs_db.packagedata;
INSERT INTO new_ai_cabs_db.packagedata (packageDataId, packageType, companyId, packages, isDeleted, createdAt)
SELECT pd.packageDataId, pd.packageType, pd.companyId, pd.packages, pd.isDeleted, pd.createdAt 
FROM vehiclemanagement.packagedata pd
INNER JOIN vehiclemanagement.company c ON pd.companyId = c.companyId;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;
