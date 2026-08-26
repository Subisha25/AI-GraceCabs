/**
 * Admin Seed Script
 * Fleet & Transport Management Platform
 *
 * Creates ONE superadmin employee record in new_ai_cabs_db.
 * Password is bcrypt-hashed. No hardcoded credentials in application code.
 *
 * Usage:
 *   npx ts-node src/scripts/seedAdmin.ts
 *
 * Development Credentials (for local use only):
 *   Email:    admin@fleet.local
 *   Password: Fleet@Admin2026
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/dbConfig';
import { Employee } from '../models/employee';
import { FleetOperator } from '../models/fleetOperator';

const SEED_EMAIL = 'admin@fleet.local';
const SEED_PASSWORD = 'Fleet@Admin2026';
const OPERATOR_ID = 'oper-0001-0000-0000-000000000001';
const SALT_ROUNDS = 12;

async function seedAdmin() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected:', process.env.DB_NAME);

    // Ensure operator exists
    const [operator, opCreated] = await FleetOperator.findOrCreate({
      where: { operatorId: OPERATOR_ID },
      defaults: {
        operatorId: OPERATOR_ID,
        operatorName: 'Fleet Operations HQ',
        contactEmail: 'operator@fleet.local',
        contactPhone: '9000000000',
        status: 'active',
      } as any,
    });
    console.log(opCreated ? '✅ Fleet Operator created' : '✅ Fleet Operator already exists');

    // Check if admin already exists
    const existing = await Employee.findOne({ where: { email: SEED_EMAIL } });
    if (existing) {
      console.log('ℹ️  Admin already exists:', SEED_EMAIL);
      console.log('   To reset, run the clean_reset.sql first.');
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

    // Create admin employee
    const adminId = uuidv4();
    await Employee.create({
      employeeId: adminId,
      username: 'Platform Admin',
      email: SEED_EMAIL,
      phno: '9000000001',
      password: hashedPassword,
      role: 'superadmin',
      operatorId: OPERATOR_ID,
      status: 'active',
    } as any);

    console.log('');
    console.log('✅ Admin seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email:    ', SEED_EMAIL);
    console.log('   Password: ', SEED_PASSWORD, '  ← local dev only');
    console.log('   Role:      superadmin');
    console.log('   Operator: ', OPERATOR_ID);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚠️  Keep credentials secure. Do not commit to source control.');

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
  }
}

seedAdmin();
