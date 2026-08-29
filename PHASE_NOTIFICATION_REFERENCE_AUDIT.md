# Phase Notification Reference Audit

This report details the comparison and audit of the reference project `D:\graceplaygps-vehiclemanagementsystem` against the target PHP Laravel implementation `D:\New Pcs\Grace---Web-ApplicationAI`.

---

## 1. Reference Project Notification Analysis

### SMS Provider
- **Provider**: **2Factor (2factor.in)**
- **Endpoints**:
  - OTP Sending Route: `https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/{otp_val}/{template_name}`
  - Template Transactional SMS Route: `https://2factor.in/API/R1/?module=TRANS_SMS&apikey={api_key}&to={to}&from={sender_id}&templatename={template}&var1=...`
  - Single Text SMS Route: `https://2factor.in/API/V1/{api_key}/ADDON_SERVICES/SEND/SINGLE_SMS`
- **DLT Sender ID**: Configured via DLT registration (retrieved via `process.env.TWO_FACTOR_SENDER_ID`).
- **DLT Templates**:
  - `Driver Assigning` (variables: Driver Name, Customer Name, Customer Mobile, Route Link)
  - `Booking Confimation Message` (variables: Customer Username, Booking Code, Route Link, Formatted Date, Driver Name, Driver Mobile, Vehicle Type, Vehicle Number, Company Name, Support Contact)
  - `BookingConfirmGuest` (variables: Guest Name, Driver Name, Driver Mobile, Vehicle Type, Vehicle Number, Formatted Date, Company Name, Support Contact)

### Email Provider
- **Provider**: Standard SMTP Server (configured with Godaddy / Mailgun in config files).
- **Credentials/Configuration Source**: Loaded from the database dynamically via `Configuration` model schema (`smtpServer`, `smtpEmailAddress`, `smtpEmailPassword`, `smtpEmailPort`).

### WhatsApp Provider
- **Provider**: **Meta Cloud API (Facebook Graph API)**
- **Endpoint**: `https://graph.facebook.com/v21.0/{phoneNumberId}/messages`
- **Method**: POST
- **Headers**: `Authorization: Bearer {metaToken}`
- **Payload Format**: Text messages sent directly using the `text` field type.

---

## 2. Target Project Configuration Requirements (Laravel)

To support complete compatibility, we will leverage the Laravel configuration and notification system:

### 1. SMS Service Configuration (`.env`)
```env
SMS_PROVIDER=2factor
TWO_FACTOR_API_KEY=Credential exists / configured
TWO_FACTOR_SENDER_ID=Credential exists / configured
TWO_FACTOR_TEMPLATE_NAME=OTP1
```

### 2. WhatsApp Service Configuration (`.env`)
```env
META_WHATSAPP_TOKEN=Credential exists / configured
META_WHATSAPP_PHONE_ID=Credential exists / configured
```

### 3. Email/SMTP Service Configuration (`.env` & DB)
Mail config in Laravel should leverage standard SwiftMailer/Symfony Mailer options (`mail.php` config):
- `MAIL_MAILER=smtp`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`

---

## 3. Implementation Checklist in Current Laravel Backend

1. **OTP Verification & API Integration**:
   - Clean implementation of random 6-digit OTP generation, expiry (5 min), resend limits, resend cooldown (60 seconds), attempt limit (3 attempts), and actual SMS dispatch via 2Factor OTP API.
2. **Notification Service Layer**:
   - Create a central `App\Services\NotificationService` encapsulating:
     - `sendSms($to, $message)`
     - `sendSmsTemplate($to, $templateName, $variables)`
     - `sendWhatsApp($to, $message)`
     - `sendEmail($to, $subject, $view, $data, $attachments)`
3. **Trigger Points**:
   - Customer Registration Confirmation.
   - Booking Creation.
   - Booking Acceptance/Confirmation.
   - Driver Assignment / Reassignment.
   - Trip Start OTP Verification & Dispatch.
   - Trip End OTP Verification, Distance Calculation, and Invoicing.
   - Payment Success receipt delivery.
   - Cash Payment recorded by Admin receipt delivery.
   - Month-End automated billing invoice compilation.
4. **Professional Invoice PDF Layout**:
   - Use Laravel Dompdf to render the HTML invoice views including operator information, trip metadata, actual KM details, base billing rate per KM, CGST/SGST taxes, final total, and payment status badge.
