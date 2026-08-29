# Reference Notification Configuration Audit

This audit document investigates the notification credentials, service files, and configurations of the reference project `D:\graceplaygps-vehiclemanagementsystem` (read-only) and details their migration and verification inside `D:\New Pcs\Grace---Web-ApplicationAI`.

---

## 1. SMS (2Factor) Configuration Audit
* **Provider**: 2Factor (2factor.in)
* **Configuration Status**: **NOT FOUND**
* **Location in Reference Project**:
  - Code reference: `backend/src/config/config.ts` (retrieved via `process.env.TWOFACTOR_API_KEY` and `process.env.TWOFACTOR_TEMPLATE_NAME`)
  - Environment configuration: **NOT FOUND** (The `.env` file of the reference project does not contain any keys starting with `TWOFACTOR` or `TWO_FACTOR`).
  - Database Configuration: **NOT FOUND** (Database schema scan confirmed that no columns or records exist in any table matching SMS/2Factor keys).
* **Endpoint**: `https://2factor.in/API/V1/{apiKey}/SMS/{mobile}/{otp}/{templateName}` (for OTP) and `https://2factor.in/API/R1/?module=TRANS_SMS&apikey={apiKey}...` (for templates).
* **Sender / Template Info**:
  - DLT Sender ID: Configured via environment variable (`TWO_FACTOR_SENDER_ID`)
  - Template Name: Configured via environment variable (`TWOFACTOR_TEMPLATE_NAME`, default `'OTP1'`)
* **Credential Status**: **NOT FOUND** (No usable keys exist in files or databases)
* **Migration Status**: Skipped (no credentials available to migrate).
* **Test Result**: **CONFIGURATION MISSING** (Tests skipped with application warning: "SMS gateway configuration error (missing key)").

---

## 2. Email (SMTP) Configuration Audit
* **Provider**: Gmail SMTP
* **Host**: `smtp.gmail.com`
* **Port**: `587`
* **Encryption**: `TLS`
* **Credential Status**: **FOUND — PROVIDER TEST FAILED**
* **Configuration Location in Reference Project**:
  - Table: `configuration` in reference database `vehiclemanagement`.
  - Schema keys: `smtpServer`, `smtpEmailAddress`, `smtpEmailPassword`, `smtpEmailPort`.
* **Migration Status**: **COMPLETED** (Migrated SMTP parameters dynamically to `laravel-backend/.env`).
* **Test Result**: **PROVIDER FAILURE**
  - **SMTP Handshake**: Connection established successfully.
  - **Provider Response**: `535-5.7.8 Username and Password not accepted` (Gmail BadCredentials code 535).
  - **SMTP Delivery Status**: **FAILED** (Inbox delivery could not be completed because the credentials stored in the reference database are expired or invalid).

---

## 3. WhatsApp (Meta Cloud API) Configuration Audit
* **Provider**: Meta Cloud API (Facebook Graph API)
* **Phone Number ID**: **NOT FOUND** (in reference files/database)
* **Token**: **NOT FOUND** (in reference files/database)
* **Configuration Location in Reference Project**:
  - Code reference: `backend/src/utils/whatsapp.ts` (uses `process.env.META_WHATSAPP_TOKEN` and `process.env.META_WHATSAPP_PHONE_ID`)
  - Database Configuration: **NOT FOUND** (Database schema scan confirmed no WhatsApp keys are stored).
* **Endpoint**: `https://graph.facebook.com/v21.0/{phoneNumberId}/messages`
* **Migration Status**: Skipped (no credentials available).
* **Test Result**: **CONFIGURATION MISSING** (WhatsApp notifications are skipped gracefully as meta credentials are not configured).

---

## 4. Database Schema Scanning & Findings

A programmatic scan of all reference MySQL tables was conducted:
- Core configuration settings are stored inside the `configuration` table in the `vehiclemanagement` database.
- Column types and structures are modeled around single-smtp routing parameters.
- No columns related to Meta Cloud API, Facebook Graph tokens, or 2Factor SMS APIs exist in the reference database schemas.
- Consequently, these credentials were loaded from the execution environment variables (e.g. system properties or PM2 environment setups) on deployment servers rather than local repository configurations.
