# Notification Event Matrix

This document outlines the notification channels used for each business event in the system, specifying mandatory vs. optional channels.

## Notification Rule
- **SMS**: **Mandatory** channel for all customers and drivers (where a valid mobile number exists).
- **Email**: **Sent if exists** (used for registration, booking, and invoices when the email is available).
- **WhatsApp**: **Optional** (used as an additional transaction-tracking channel if Meta WhatsApp API credentials are configured).

---

## Event Matrix

| Event ID | Event Name | Customer SMS | Customer Email | Customer WhatsApp | Driver SMS | Driver Email | Driver WhatsApp | Admin Alert / Notification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **OTP Request** | **Mandatory** | N/A | Optional | N/A | N/A | N/A | N/A |
| **2** | **Customer Registration** | **Mandatory** | **Sent if exists** | Optional | N/A | N/A | N/A | Logged in Dashboard |
| **3** | **Booking Created** | **Mandatory** | **Sent if exists** | Optional | N/A | N/A | N/A | Alert displayed in admin panel |
| **4** | **Booking Confirmed** | **Mandatory** | **Sent if exists** | Optional | N/A | N/A | N/A | N/A |
| **5** | **Driver Assigned** | **Mandatory** | **Sent if exists** | Optional | **Mandatory** | **Sent if exists** | Optional | Assigned status updated |
| **6** | **Driver Reassigned** | **Mandatory** | **Sent if exists** | Optional | **Mandatory** (New & Old) | **Sent if exists** | Optional | Reassigned status updated |
| **7** | **Trip Started** | **Mandatory** | **Sent if exists** | Optional | **Mandatory** | N/A | N/A | Dashboard active status |
| **8** | **Trip Completed** | **Mandatory** | **Sent if exists** (with PDF) | Optional | **Mandatory** | N/A | N/A | Dashboard completed status |
| **9** | **Payment Successful** | **Mandatory** | **Sent if exists** (Receipt) | Optional | N/A | N/A | N/A | Payment logs updated |
| **10** | **Cash Payment Recorded** | **Mandatory** | **Sent if exists** (Receipt) | Optional | N/A | N/A | N/A | Audit log generated |
| **11** | **Normal Invoice Generated** | **Mandatory** | **Sent if exists** (with PDF) | Optional | N/A | N/A | N/A | Invoice records updated |
| **12** | **Monthly Invoice Generated** | **Mandatory** | **Sent if exists** (with PDF) | Optional | N/A | N/A | N/A | Invoices records updated |
| **13** | **Monthly Payment Completed** | **Mandatory** | **Sent if exists** (Receipt) | Optional | N/A | N/A | N/A | Organization account ledger updated |
