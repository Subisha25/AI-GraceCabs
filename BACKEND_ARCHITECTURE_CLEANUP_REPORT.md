# Backend Architecture Cleanup & Login Routing Audit Report

**Date:** 2026-08-29  
**Status:** COMPLETED & VERIFIED  

---

## Executive Summary

The backend architecture audit and cleanup has been fully executed in accordance with strict single-responsibility principles:
1. **PHP Laravel Backend (`laravel-backend/`) on Port 8000** is the **sole business, data, authentication, and reporting backend** for the platform.
2. **Node.js Notification Service (`notification-service/`) on Port 5001** is a **dedicated, lightweight microservice strictly handling SMS (2Factor.in) and WhatsApp (Meta Cloud API v21.0)**.
3. **The legacy Node monolith (`backend/`)** has been permanently and cleanly removed from the repository.
4. **All frontend authentication, booking, and administrative routing** communicate exclusively with Laravel API (`http://localhost:8000/api`) via Axios.

---

## 1. Final Backend Responsibilities Matrix

| Backend Component | Technology | Port | Core Responsibilities |
|---|---|---|---|
| **`laravel-backend/`** | PHP 8.2 + Laravel 12 + MySQL | `8000` | • Customer, Driver, Company & Admin Authentication (`/api/auth/*`)<br>• OTP Generation, Storage & Verification<br>• Booking lifecycle, Dispatching, Distance Estimates<br>• Driver Assignment & Real-Time Tracking coordinates<br>• Monthly Billing, Contracts, Taxes, Invoices & DomPDF<br>• Transactional Email notifications via Gmail SMTP (`smtp.gmail.com:587`)<br>• Outbound dispatch to Notification Microservice |
| **`notification-service/`** | Node.js + TypeScript + Express | `5001` | • Direct Single SMS & OTP SMS via 2Factor.in<br>• DLT Approved Transactional Template SMS<br>• Meta WhatsApp Cloud API v21.0 Text & Template Messages<br>• Service token authentication & masked phone logging |
| **`frontend/`** | React + TypeScript + Tailwind | `3000` | • Single unified Axios client pointed to `http://localhost:8000/api` |

---

## 2. Authentication & Route Unification Details

All legacy Node authentication endpoints have been implemented and validated directly in Laravel (`laravel-backend/app/Http/Controllers/AuthController.php` & `routes/api.php`):

| Endpoint | Method | Controller Action | Auth Flow |
|---|---|---|---|
| `/api/auth/login` | `POST` | `AuthController@login` | Customer / Admin email + password login |
| `/api/auth/emplogin` | `POST` | `AuthController@login` | Employee / Operator login |
| `/api/auth/companyLogin` | `POST` | `AuthController@companyLogin` | Organization manager / company login |
| `/api/auth/register` | `POST` | `AuthController@register` | Customer self-registration |
| `/api/auth/send-otp` | `POST` | `AuthController@sendOtp` | Customer OTP dispatch |
| `/api/auth/verify-otp` | `POST` | `AuthController@verifyOtp` | Customer OTP verification & Sanctum token issue |
| `/api/auth/forgetPasswordSendOtp` | `POST` | `AuthController@forgetPasswordSendOtp` | Password recovery OTP dispatch via SMTP/SMS |
| `/api/auth/verifyOtpPassword` | `POST` | `AuthController@verifyOtpPassword` | Password recovery OTP verification |
| `/api/auth/forgetPassword` | `PUT` | `AuthController@resetPassword` | Password update with verified OTP session |
| `/api/auth/changePassword` | `PUT` | `AuthController@changePassword` | Authenticated profile password modification |
| `/api/company/{seoUrl}` | `GET` | `OrganizationController@getBySeoUrl` | Company branding & logo resolution |
| `/api/company/getAllCompany` | `GET` | `OrganizationController@getAllCompany` | Multi-tenant organization list |

---

## 3. Microservice Security & Communications

- **Inter-Service Authentication:** Secured via `Bearer grace_internal_notif_sec_key_2026`.
- **Fault-Tolerant Dispatching:** Laravel's `NotificationService.php` and `SmsProvider.php` call `http://127.0.0.1:5001/api/notifications/*` with a 5-second timeout and graceful error logging, ensuring cab bookings, driver assignments, and billing operations never fail if external communication networks experience momentary latency.
- **Privacy Logging:** All mobile numbers in the microservice logs are automatically masked (e.g., `+91 90****0818`).

---

## 4. Verification & Test Results

### 1. Laravel Feature Test Suite
- `NotificationServiceTest.php`: **4 / 4 passed (8 assertions)**
- `PlatformApiTest.php`: **2 / 2 passed (35 assertions)**
- `InvoicePaymentTest.php`: **5 / 5 passed (29 assertions)**
- `ContractBillingTest.php`: **6 / 6 passed (38 assertions)**
- **Total PHPUnit Assertions:** **110+ assertions passed (0 failures)**

### 2. Notification Service Suite
- Jest Tests: **13 / 13 passed (100%)**
- TypeScript Compilation: **0 errors (`tsc` build clean)**

### 3. Cleanup Verification
- Obsolete folder `d:\New Pcs\Grace---Web-ApplicationAI\backend` confirmed deleted.
- Legacy port references (`5000`, `5005`) cleaned from frontend components.
