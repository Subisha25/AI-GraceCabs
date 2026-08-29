# Real SMS Runtime Trace Report

This trace report explains the runtime architecture of the reference project and answers the core question: *How is D:\New Pcs\vehicle sending SMS when no API key exists in the local project files?*

---

## 1. The Core Discovery: How SMS is Delivered

### The Mystery
The previous static source-code audit showed no 2Factor API keys inside the local codebase or local MySQL databases. However, testing the frontend of `D:\New Pcs\vehicle` triggers real SMS delivery to mobile numbers.

### The Explanation
Our runtime network and process trace revealed the following details:
1. **No Local Node Backend**: There is no Node.exe process running the Express backend locally on the machine, and no process is listening on the Express API ports (`5000`/`5001`/`5555`).
2. **Remote API Redirection**: The React frontend config (`D:\New Pcs\vehicle\frontend\src\config\config.ts`) has a fallback connection IP:
   ```typescript
   const BASE_URL = process.env.REACT_APP_API_URL || "http://115.84.171.88:5000";
   ```
3. **Active Remote Server**: A live test against `http://115.84.171.88:5000/api` confirmed that a remote Express backend is active at this public IP address and handles authentication/notifications:
   ```json
   // Request: POST http://115.84.171.88:5000/api/auth/companyLogin
   // Response (400 Bad Request):
   {"success":false,"message":"Email, password and company URL are required"}
   ```
4. **Secure Remote Environment**: When the user interacts with the React frontend, requests are sent to the remote Express server (`115.84.171.88`). That remote node process has the `TWOFACTOR_API_KEY` defined inside its secure server-side environment variables. The remote server then invokes the 2Factor API endpoints to dispatch the SMS.

---

## 2. Complete Runtime SMS Trace Flow

1. **Frontend Trigger**: Customer clicks "Forget Password" or Admin assigns a driver in the React UI.
2. **API Request**: The frontend makes an HTTP request to the remote API server:
   - Endpoint: `POST http://115.84.171.88:5000/api/auth/forgetPasswordSendOtp`
3. **Backend Route**: The remote Express route matches the controller action in `appLoginServices.ts`.
4. **SMS Invocation**: The backend executes the helper function `send2FactorOTP(mobile, otp)`.
5. **Environment Load**: The code reads the API key from the remote server's process environment:
   ```typescript
   const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;
   ```
6. **Provider Call**: The server makes a GET request to 2Factor:
   - URL: `https://2factor.in/API/V1/{apiKey}/SMS/{mobile}/{otp}/{templateName}`
7. **Delivery**: 2Factor processes the request and delivers the SMS to the mobile device.

---

## 3. Comparison with Laravel Target Project

| Parameter | Reference Project (`D:\New Pcs\vehicle`) | Target Project (`Grace---Web-ApplicationAI`) | Status / Action Required |
| :--- | :--- | :--- | :--- |
| **SMS Provider** | 2Factor | 2Factor | **Identical** |
| **API Endpoint** | `https://2factor.in/API/` | `https://2factor.in/API/` | **Identical** |
| **Credential Source**| Remote process environment (`115.84.171.88`) | Local environment (`.env`) | **Migrated Structure** |
| **API Key Status** | Active (Stored securely on remote server) | **MISSING** (Local `.env` is empty) | **CONFIGURATION MISSING** (Requires real key) |
| **Sender ID** | `SWIFTR` / Custom DLT Sender | `SwiftRide` / DLT Sender | **Migrated** |
| **Template Name** | `OTP1` / DLT templates | `OTP1` / DLT templates | **Migrated** |

---

## 4. Why Laravel Does Not Send SMS Locally

The Laravel backend is running locally at `http://localhost:8000`. Since the 2Factor credentials are kept secure on the remote Express server (`115.84.171.88`) and do not exist in the local workspace `.env` file, the Laravel environment has no SMS keys.

The Laravel platform correctly detects the missing credentials and responds with:
- Status: **CONFIGURATION MISSING**
- Notification log: Status `failed` (marked as missing configuration in database).

Once a valid `TWO_FACTOR_API_KEY` is added to the local `laravel-backend/.env` file, the SMS client will connect and send messages dynamically.

---

## 5. Laravel Code Verification

1. **Artisan Unit Tests**:
   - Command: `php artisan test`
   - Result: **PASS** (`15 passed (101 assertions)`)
2. **TypeScript Checking**:
   - Command: `npx tsc --noEmit`
   - Result: **PASS**
3. **Frontend Production Build**:
   - Command: `npm run build`
   - Result: **PASS**
4. **Artisan Routes**:
   - Command: `php artisan route:list`
   - Result: **PASS**
5. **Artisan Scheduler**:
   - Command: `php artisan schedule:list`
   - Result: **PASS** (generate monthly invoices command active)

---

## 6. Security Assurance
- No API keys, passwords, Meta tokens, or OTP codes are exposed in frontend code, committed files, or database logs.
