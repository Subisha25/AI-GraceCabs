# LOGIN CONNECTION FIX REPORT

**Date & Time**: 2026-08-31 10:30 IST  
**Target Repository**: `D:\New Pcs\Grace---Web-ApplicationAI`  
**Application Component**: Customer Login (`Login.tsx` / `http://localhost:3000/login`)

---

## 1. Original Browser Error
```text
login
(failed) net::ERR_CONNECTION_REFUSED
Initiator: Login.tsx
```

---

## 2. Actual Frontend API URL
- Configured in [frontend/src/config/config.ts](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/frontend/src/config/config.ts):
  * `BASE_URL`: `http://localhost:8000`
  * `apibaseurl`: `http://localhost:8000`
- Configured in [frontend/src/utils/axiosInstance.ts](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/frontend/src/utils/axiosInstance.ts):
  * `baseURL`: `http://localhost:8000/api`
- Login request URL initiated by [frontend/src/pages/Auth/Login.tsx](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/frontend/src/pages/Auth/Login.tsx):
  * `POST http://localhost:8000/api/auth/login`

---

## 3. Actual Laravel API URL
- Laravel Main Business Backend: `http://127.0.0.1:8000` (and `http://localhost:8000`)
- Endpoint registered in `laravel-backend/routes/api.php`:
  * `POST /api/auth/login` -> `App\Http\Controllers\AuthController::login`
  * `POST /api/auth/emplogin` -> `App\Http\Controllers\AuthController::login`

---

## 4. Root Cause
1. **Laravel Server Inactive on Port 8000**:
   - The frontend development server (`npm start`) on port 3000 was active, but the Laravel backend development server (`php artisan serve`) on port 8000 was not running in the background.
   - When the user clicked "Login", the browser attempted to connect to TCP port 8000 on `localhost`. Because no process was listening on port 8000, Windows OS refused the socket connection immediately (`net::ERR_CONNECTION_REFUSED`).
2. **Missing `Accept: application/json` Header in Axios**:
   - Axios defaults did not include `Accept: application/json`, which in Laravel could cause 302 redirects instead of standard JSON responses during API validation failures.

---

## 5. Files Changed
1. [frontend/src/utils/axiosInstance.ts](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/frontend/src/utils/axiosInstance.ts):
   - Added `'Accept': 'application/json'` to default headers to guarantee clean JSON REST communication.
2. [laravel-backend](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/laravel-backend):
   - Launched persistent background daemon process: `php artisan serve --host=127.0.0.1 --port=8000`.

---

## 6. Laravel Server Status
- **Status**: **ONLINE & ACTIVE (Daemon Background Process)**
- **Host / Port**: `127.0.0.1:8000`
- **Output**: `INFO Server running on [http://127.0.0.1:8000]`
- **Connection Test**: `Test-NetConnection -ComputerName 127.0.0.1 -Port 8000` -> `TcpTestSucceeded: True`

---

## 7. Customer Login Route
- **Route**: `POST /api/auth/login`
- **Controller**: `App\Http\Controllers\AuthController@login`
- **Request Body**:
  ```json
  {
    "email": "subisha@danfoss.com",
    "password": "customer123"
  }
  ```
- **Response Format (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "token": "25|UfuOs8AL3gwBfzyqcr1fJQqy0WpM4e0PKZPhX7Nl0d0fe669",
    "accessToken": "25|UfuOs8AL3gwBfzyqcr1fJQqy0WpM4e0PKZPhX7Nl0d0fe669",
    "user": {
      "id": "09dca21c-5fa8-4182-bbd0-cea3861d1e26",
      "name": "Subisha Customer",
      "email": "subisha@danfoss.com",
      "mobile": "9999999992",
      "role": "customer",
      "status": "active"
    },
    "role": "customer",
    "id": "09dca21c-5fa8-4182-bbd0-cea3861d1e26",
    "name": "Subisha Customer",
    "companyId": "495f62bc-940f-4e91-bd44-10e9136ec4fd"
  }
  ```

---

## 8. CORS Result
- Configured in [laravel-backend/config/cors.php](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/laravel-backend/config/cors.php):
  * `paths`: `['api/*', 'sanctum/csrf-cookie']`
  * `allowed_origins`: `['http://localhost:3000', 'http://127.0.0.1:3000']`
  * `supports_credentials`: `true`
  * `allowed_methods`: `['*']`
  * `allowed_headers`: `['*']`
- **CORS Result**: Preflight OPTIONS and cross-origin POST requests from `http://localhost:3000` to `http://localhost:8000` execute with 200 OK and valid CORS headers.

---

## 9. Database Connection Result
- Database: MySQL `grace_cabs_db`
- `php artisan migrate:status`: All 27 migrations are in status `[Ran]`. No tables were wiped or dropped.
- User accounts verified:
  * Customer 1: `subisha@danfoss.com` (Active)
  * Customer 2: `rajesh@test.local` (Active)
  * Customer 3: `subisha2002.m@gmail.com` (Active)
  * Manager: `hr@danfoss.com` (Active)
  * Superadmin: `ganthimurugan1977@gmail.com` (Active)

---

## 10. Real Login Test Result
- **Invalid Password Test**: `POST /api/auth/login` with wrong password -> returned `401 Unauthorized` (`{ success: false, message: 'Invalid email or password credentials.' }`).
- **Valid Customer Login Test**: `POST /api/auth/login` with `subisha@danfoss.com` / `customer123` -> returned `200 OK`, valid Sanctum bearer token, user details, and role `customer`.

---

## 11. OTP Flow Result
- Endpoints:
  * `POST /api/auth/send-otp`
  * `POST /api/auth/verify-otp`
- Mobile OTP login and password-based login both exist in `Login.tsx`. Password login directly uses Laravel with zero external microservice dependency.

---

## 12. Final Browser Network Request (End-to-End Browser Test)
A full automated browser session was conducted using `browser_subagent`:
1. Navigated to `http://localhost:3000/login`.
2. Entered `subisha@danfoss.com` into Email input.
3. Entered `customer123` into Password input.
4. Clicked Login.
5. **Network Result**: `POST http://localhost:8000/api/auth/login` returned **HTTP 200 OK**.
6. **UI Result**: Displayed "Welcome back, Subisha Customer!" and navigated to `http://localhost:3000/customer/dashboard` displaying user dashboard greeting ("Welcome, Subisha Customer 👋").
7. **`net::ERR_CONNECTION_REFUSED`**: **RESOLVED (0 Errors)**.

---

## 13. TypeScript Verification Result
- Command: `node node_modules/typescript/bin/tsc --noEmit`
- Result: **0 errors (Exit code 0)**

---

## 14. Laravel Test Result
- Command: `php vendor/phpunit/phpunit/phpunit`
- Result: **OK (20 tests, 113 assertions) — 100% Passed (0 failures)**

---

## 15. Notification Microservice Test Result
- Command: `npm test`
- Result: **13 / 13 Jest tests passed (100%)**

---

## 16. Remaining Issues
- None. The customer login flow, backend server, database authentication, and browser session are fully operational and verified.
