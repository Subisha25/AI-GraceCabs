# Database Setup Guide - New Local AI Mobility Platform

This document describes how to configure, initialize, and manage the local database for the **New Local AI Mobility Platform**.

## 1. Requirements

- **Database System**: MySQL (v8.0 or v5.7 recommended).
- **Default Port**: `3306` (or configured via `DB_PORT` in `.env`).
- **Default Database Name**: `new_ai_cabs_db`.

---

## 2. Environment Configuration

Ensure that your `backend/.env` file has the correct local MySQL credentials:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=new_ai_cabs_db
DB_DIALECT=mysql
```

---

## 3. Creating the Database

To create the database manually, connect to your local MySQL instance (e.g. via MySQL Command Line, phpMyAdmin, or DBeaver) and run:

```sql
CREATE DATABASE IF NOT EXISTS `new_ai_cabs_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4. Recreating Tables & Seeding

All tables and configurations can be initialized using the `db_init.sql` script located at the project root.

Run the script using the MySQL CLI:

```bash
mysql -u root -p new_ai_cabs_db < db_init.sql
```

Alternatively, when you boot the backend application for the first time via `npm run dev`, Sequelize will automatically synchronize and create all tables if they do not exist.

---

## 5. Seed Data & Admin Account

The `db_init.sql` includes default seeding:
- **Employee Admin Account**:
  - **Username/Email**: `admin@local.platform`
  - **Password**: `admin123`
  - **Role**: `superadmin`

---

## 6. How to Reset the Database

To wipe out all data and reset the tables, execute the following commands:

```bash
# Connect to MySQL and drop the database
mysql -u root -p -e "DROP DATABASE IF EXISTS new_ai_cabs_db;"

# Recreate the database
mysql -u root -p -e "CREATE DATABASE new_ai_cabs_db;"

# Run the initialization SQL script again
mysql -u root -p new_ai_cabs_db < db_init.sql
```

---

## 7. Data Migration from vehiclemanagement

If you have an existing local MySQL database named `vehiclemanagement` and need to safely migrate setup, configuration, and master lookup values to `new_ai_cabs_db` in a read-only manner, use the repeatable migration SQL script provided.

Run the migration script using the Command Prompt (cmd) to support file redirection:

```cmd
"C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysql.exe" -u root new_ai_cabs_db < "d:\New Pcs\Grace---Web-ApplicationAI\database\migrate_vehiclemanagement_data.sql"
```

> [!NOTE]
> - `vehiclemanagement` is only read from (SELECT queries) and is NEVER altered, updated, or written to.
> - Transactional history logs (bookings, payments, invoices) are excluded from the copy to keep the new platform development clean.
> - Duplicate key conflicts (such as duplicated partner emails) are automatically resolved inline within the migration script.

