-- ============================================================
-- Fleet & Transport Management Platform
-- Database Clean Reset Script  v2 (actual table names verified)
-- Target: new_ai_cabs_db ONLY
-- DO NOT RUN on vehiclemanagement
-- ============================================================

USE new_ai_cabs_db;

SET FOREIGN_KEY_CHECKS = 0;

-- LEVEL 1: Leaf / detail tables
TRUNCATE TABLE booking_passenger;
TRUNCATE TABLE otp;
TRUNCATE TABLE ordersummery;
TRUNCATE TABLE mapcount;
TRUNCATE TABLE short_links;

-- LEVEL 2: Invoice / oncall line items
TRUNCATE TABLE monthly_invoice_items;
TRUNCATE TABLE oncallinvoiceitems;

-- LEVEL 3: Invoices & payments
TRUNCATE TABLE payment;
TRUNCATE TABLE monthly_invoice;
TRUNCATE TABLE monthlybookingsequence;
TRUNCATE TABLE oncallinvoice;
TRUNCATE TABLE invoice;
TRUNCATE TABLE invoice_sequences;
TRUNCATE TABLE payment_sequence;

-- LEVEL 4: Trips (closependings)
TRUNCATE TABLE closependings;

-- LEVEL 5: Bookings
TRUNCATE TABLE booking;
TRUNCATE TABLE booking_sequence;

-- LEVEL 6: Package contracts
TRUNCATE TABLE organization_package;

-- LEVEL 7: Packages
TRUNCATE TABLE packagedata;
TRUNCATE TABLE package;

-- LEVEL 8: Users (customers + org users)
TRUNCATE TABLE user;

-- LEVEL 9: Companies (organizations)
TRUNCATE TABLE company;

-- LEVEL 10: Drivers
TRUNCATE TABLE drivers;

-- LEVEL 11: Vehicle physical assets
TRUNCATE TABLE vehiclemaster;

-- LEVEL 12: Vehicle models
TRUNCATE TABLE vehicle;

-- LEVEL 13: Vehicle types
TRUNCATE TABLE vehicletype;

-- LEVEL 14: Supporting masters
TRUNCATE TABLE vendor;
TRUNCATE TABLE partners;
TRUNCATE TABLE tax;
TRUNCATE TABLE paymentmode;
TRUNCATE TABLE pickuparea;
TRUNCATE TABLE pickupcity;
TRUNCATE TABLE configuration;
TRUNCATE TABLE emailconfiguration;

-- LEVEL 15: Employees (admin users)
TRUNCATE TABLE employee;

-- LEVEL 16: Fleet operator (tenant root)
TRUNCATE TABLE fleet_operator;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED: One Fleet Operator (tenant root)
-- ============================================================
INSERT INTO fleet_operator (
  operatorId, operatorName, contactEmail, contactPhone, status, createdAt, updatedAt
) VALUES (
  'oper-0001-0000-0000-000000000001',
  'Fleet Operations HQ',
  'operator@fleet.local',
  '9000000000',
  'active',
  NOW(),
  NOW()
);

-- ============================================================
-- VERIFY COUNTS
-- ============================================================
SELECT 'fleet_operator' AS table_name, COUNT(*) AS record_count FROM fleet_operator
UNION ALL SELECT 'employee', COUNT(*) FROM employee
UNION ALL SELECT 'booking', COUNT(*) FROM booking
UNION ALL SELECT 'vehiclemaster', COUNT(*) FROM vehiclemaster
UNION ALL SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL SELECT 'company', COUNT(*) FROM company
UNION ALL SELECT 'package', COUNT(*) FROM package
UNION ALL SELECT 'invoice', COUNT(*) FROM invoice
UNION ALL SELECT 'payment', COUNT(*) FROM payment
UNION ALL SELECT 'user', COUNT(*) FROM user;
