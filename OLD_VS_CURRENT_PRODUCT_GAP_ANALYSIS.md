# Factual Gap Analysis: Legacy vs. Current Platform

This document presents a detailed audit and comparison between the legacy Grace Cabs version and the currently implemented Fleet & Transport Management Platform.

---

## 1. Inventory of Removed, Retained, and Modified Pages

### A. Home Page / Landing Experience
*   **Old Page**: `SuperAdmin/pages/Homepage/home`
    *   *Purpose*: Public landing page branded with "Grace Cabs" content, terms, and direct contact widgets.
    *   *Current Status*: **REPLACED & REFOCUSED**. 
    *   *Action*: Refactored to `components/Homepage/homepage.tsx`. Removed all Grace Cabs references and changed branding to "New Local AI Mobility Platform".

### B. Booking Forms & Flow
*   **Old Pages**: 
    1.  `monthlybooking.tsx`: Corporate client schedules.
    2.  `oncallbooking.tsx`: Manual on-demand booking entry.
*   **Current Status**: **RETAINED & COMPLEMENTED**.
    *   *New Page Added*: [CreateBookingPage.tsx](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/frontend/src/components/CreateBookingPage.tsx) is introduced as a dynamic progressive ride request page available directly to logged-in customers and managers, resolving the gap where client-facing self-service booking was missing.

### C. Client & Organization Management
*   **Old Page**: `Company` master pages.
    *   *Purpose*: Setup partner companies.
    *   *Current Status*: **REFACTOR & REBRAND**. Mapped physically under the same schema but conceptually and visually separated to "Organization Clients" in the Operator panel.
    *   *Contract Price Assignment*: Modified [EditCompany.tsx](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/frontend/src/SuperAdmin/pages/Master/Company/EditCompany.tsx) to integrate the `OrganizationPackage` pricing override panel, enabling contract-specific extra KM, base amount, and hourly rate overrides.

---

## 2. Business Feature Gap Matrix

| Feature Area | Legacy Status (Old) | Current Status | Implemented / Missing | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Authentication** | Unified database login | Dynamic roles JWT | **COMPLETE** | Injects custom `operatorId` and `companyId` scopes. |
| **Operator Isolation** | Missing / Single tenant | Checked via JWT | **COMPLETE** | Queries auto-filtered by parsed `req.operatorId`. |
| **Org Client Separation** | Treated as general clients | Isolated context | **COMPLETE** | Managers query records scoped to `companyId`. |
| **Booking Flow** | Staff on-call bookings | Progressive UI | **COMPLETE** | Mapped to `/booking/create` for customers/managers. |
| **Package Contracts** | Fixed template packages | Custom overrides | **COMPLETE** | Computed dynamically on the billing engine. |
| **Trip Lifecycles** | Merged inside booking states | Split operational logs | **COMPLETE** | Logged via `booking` ➔ `closependings` schema. |
| **Reports Summary** | Fixed export sheets | Retained sheets | **COMPLETE** | Kept PDF/Excel download capabilities. |

---

## 3. Booking Workflow Comparison

### Old Booking Request Flow (Grace Cabs)
```text
Staff Login ➔ On-Call Booking Page ➔ Input Passenger details ➔ Submit ➔ Backend Booking record
```

### Current Booking Flow
```text
Customer/Manager Login ➔ Clicks "Book Cab" ➔ Progressive Category selector ➔ Input dates/times 
➔ If corporate: Input Passenger Manifest rows ➔ Submit ➔ Backend Booking & BookingPassenger entry
```

---

## 4. Vehicle Architecture Comparison

*   **Legacy vehicle vs vehiclemaster**:
    *   `vehicle`: Vehicle Model Catalog details (e.g. SUV, Sedan templates).
    *   `vehiclemaster`: Physical vehicle assets containing unique license plates and registration numbers.
*   **Current Architecture**: Reconstructed with multi-tenant operators. Every vehicle master asset is linked to a model catalog item and dynamically filtered by `operatorId` in sessions.

---

## 5. Billing, Invoicing, and Payment Flow Comparison

*   **Old Billing Flow**: Direct generation of invoices from closepending logs using default package base rates.
*   **Current Billing Flow**:
    1.  Operator selects an onboarded organization and links a contract package override.
    2.  Trips are executed and completed (logged in `closependings`).
    3.  `createMonthlyInvoice` queries override parameters dynamically.
    4.  Aggregated invoice balance updates and PDF export displays custom overrides.

---

## 6. Functional Capabilities Added & Retained

### Functionality Added
1.  **Strict Token Verification**: Context scopes (`operatorId`, `companyId`) are verified dynamically and decrypted on the server, eliminating parameter forgery.
2.  **SaaS Tenant Multi-Tenancy**: Database records are segregated using `operatorId` values.
3.  **Dynamic Contract Assignments**: Overrides can be updated dynamically per client.

### Functionality Retained (Branding Cleared)
-   Invoice PDF Generation.
-   Overall Revenue Reports exports.
-   Staff Employee and Driver ledger systems.
-   Mail notification template loops.
