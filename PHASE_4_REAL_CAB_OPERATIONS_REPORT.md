# Phase 4 Real Cab Operations - Implementation Report

This report documents the implementation details, state transitions, GPS integrations, database transaction layouts, and verification logs for the Real Cab Booking Lifecycle.

---

## 1. Booking State Machine
Strict transitions have been enforced on the backend via validators, state checks, and database transaction policies:
- `PENDING` → `ACCEPTED` (or `REJECTED`)
- `ACCEPTED` → `DRIVER_ASSIGNED` (represented in database status column as `confirmed`)
- `confirmed` (`DRIVER_ASSIGNED`) → `STARTED`
- `STARTED` → `COMPLETED` (Generates Invoice automatically and sets status to `payment_pending` on invoices)

**Invalid transitions** (e.g. `completed` → `started`, `rejected` → `started`, or `paid` → `pending`) are strictly blocked at the API layer returning a `422 Unprocessable Entity` response with a clear error payload.

---

## 2. Accept/Reject Implementation
- **Accept Booking (`POST /api/bookings/{id}/accept`):** Restricts access to dispatcher roles (`superadmin`, `admin`, `accountant`). Transactionally moves status to `accepted` and logs `accepted_at` timestamp.
- **Reject Booking (`POST /api/bookings/{id}/reject`):** Validates a required `reason` string. Stores the reason inside the new database column `rejection_reason` (added via migration file `2026_08_21_160500_add_rejection_reason_to_bookings_table.php`). Moves booking status to `rejected`.

---

## 3. Driver/Vehicle Assignment
- **Endpoint (`POST /api/bookings/{id}/assign-driver`):** Takes `driver_id` and `vehicle_id`.
- **Availability Validations:** 
  - Prevents overlapping bookings. Query-checks if the driver or vehicle is currently linked to any active booking with status `confirmed` or `started`. If found, blocks assignment with a `422` error.
  - Verifies that driver and vehicle belong to the operator context and are in active status (`active` for drivers, `available` for vehicles).
- **Updates:** Assigns IDs, sets `driver_assigned_at`, sets booking status to `confirmed` and creates/updates a matching `Trip` record with status `assigned`.

---

## 4. Customer Notifications
Dispatched via `NotificationService` dynamically fetching the recipient's email from the database user record:
- **On Rejection:** Sends email with Booking ID, Pickup, Drop, Date, Time, and Rejection reason.
- **On Driver Assignment:** Sends email with Booking ID, Driver Name, Driver Mobile, Vehicle Name, Vehicle Number, Pickup, Drop, Date, and Time.
- **On Trip Started / Completed:** Dispatches notifications log updates.

---

## 5. Driver Notifications
Dispatched to driver immediately after resource assignment:
- Recipient email/mobile resolved dynamically using matching driver's mobile credentials.
- Message details: Customer Name, Customer Mobile, Pickup Location, Drop Location, Booking Date, Booking Time, Vehicle Model, and Booking ID.

---

## 6. Trip Start
- **Endpoint (`POST /api/driver/trips/{id}/start`):** Restricts actions to the assigned driver.
- **State Check:** Asserts status is `confirmed` (meaning DRIVER_ASSIGNED).
- **Execution:** Captures `started_at = now()`, coordinates `start_latitude` and `start_longitude` (stores `null` safely if browser geolocation is blocked/unavailable).

---

## 7. GPS Implementation & Throttling
- Geolocation tracking triggers on the driver's device via `navigator.geolocation.watchPosition()` when trip transitions to `started` in `DriverTripDetail.tsx`.
- **Throttling Policy:** Implements checks to prevent spamming coordinates. Only dispatches `POST /api/trips/{id}/locations` if:
  - Minimum time interval elapsed (10 seconds)
  - AND minimum movement distance traversed (5 meters) using the Haversine distance formula.

---

## 8. Customer Tracking Page
- Customer track ride route: `/customer/track/:bookingId`.
- **Leaflet Integration:** Loads Leaflet CSS and JS scripts dynamically from public CDN (`unpkg.com`) without adding bulky node modules to `package.json`. Shows OpenStreetMap interactive maps and markers if GPS coordinates exist.
- **Unavailable Indicator:** Displays a clear card "Live location unavailable" if the driver has not started the trip or coordinates are absent. Never displays fake coordinates.

---

## 9. Trip Completion
- **Endpoint (`POST /api/driver/trips/{id}/complete`):** Verifies the authenticated driver is the one assigned to the trip. Asserts status is `started`.
- **GPS Capture:** Captures `completed_at`, `end_latitude`, `end_longitude`.

---

## 10. Actual Distance Calculation
- Calculated in `TripDistanceService.php` using Segment Distance Integration:
  - Retrieves all GPS coordinates recorded in `trip_locations`.
  - Sorts them in chronological order.
  - Sums segment lengths using the Haversine formula.
- **Fallback Policy:** If coordinates are insufficient (less than 2 points recorded), falls back to the booking's `estimated_distance_km` and logs the fallback event in the system.

---

## 11. Duration Calculation
- Duration computed as: `completed_at - started_at` inside `TripController@completeTrip`.
- Stored as `duration_seconds` in the database.
- React customer pages format this duration value beautifully as `HH:MM:SS`.

---

## 12. Final Fare Calculation
- Centrally computed in the backend using `FareCalculationService@calculateFare($actualDistance, $vehicle)`.
- Calculated as: `actual_distance_km * vehicle.price_per_km`.
- Avoids code duplication across pages and controllers.

---

## 13. Automatic Invoice Generation
Executed inside the DB Transaction upon trip completion:
- Generates a unique Invoice Number: `INV-` + random 8 uppercase characters.
- Computes Subtotal (= final fare), Tax (18%), and Total Amount.
- Sets initial invoice status to `payment_pending`.
- Customer immediately views invoice details and payment options under their Booking Details screen.

---

## 14. Security Verification
- Tenant Isolation: Scopes queries in `index` and `show` endpoints to block cross-user data access (customer sees their own, manager sees organization, driver sees assigned).
- Role Boundaries: Blocks non-dispatcher roles from accept/reject/assign actions, and blocks non-assigned drivers from starting/completing trips.

---

## 15. Database Transaction Handling
- Handled via `DB::transaction(...)` blocks for Accept booking, Driver assignment, and Trip completion.
- If invoice generation or trip state updating fails, the database rollback triggers immediately, preserving data consistency.

---

## 16. Email Delivery Status
- Mail configuration uses the Laravel local log driver (`MAIL_MAILER=log` in `.env`).
- Outbox emails are logged in `storage/logs/laravel.log`, distinguishing test simulations from verified production SMTP networks.

---

## 17. Tests Performed
All feature test suites passed successfully:
```text
PASS  Tests\Unit\ExampleTest
PASS  Tests\Feature\ExampleTest
PASS  Tests\Feature\PlatformApiTest
      ✓ customer lifecycle and booking operations
      ✓ booking rejection flow
```

---

## 18. Known Limitations
- Real communication providers (email SMTP/SMS/WhatsApp APIs) are mocked in local log files and database tables. Integration will follow in later production releases.
- Map tracking relies on public CDNs for Leaflet loading. Production environments may benefit from private vector tile systems.

---

PHASE 4: COMPLETE
