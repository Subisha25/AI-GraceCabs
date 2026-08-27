<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OperatorController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\TaxController;

// ── PUBLIC AUTHENTICATION & GUEST RIDE ROUTES ────────────────────────────────
Route::post('/auth/register',   [AuthController::class, 'register']);
Route::post('/auth/send-otp',   [AuthController::class, 'sendOtp']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/auth/login',      [AuthController::class, 'login']);
Route::post('/auth/emplogin',   [AuthController::class, 'login']);

// Guest Cab Bookings & Estimates
Route::post('/bookings/estimate',        [BookingController::class, 'estimate']);
Route::post('/bookings',                 [BookingController::class, 'store']);
Route::get('/public/vehicles',           [VehicleController::class, 'publicList']);
Route::post('/public/bookings/track',    [BookingController::class, 'publicTrack']);

// Public webhooks
Route::post('/payments/webhook', [InvoiceController::class, 'webhook']);

// ── PROTECTED PLATFORM ROUTES (Requires Sanctum Token) ────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Vehicles read routes accessible to all authenticated users (customer, operator, admin)
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/available', [VehicleController::class, 'available']);
    Route::get('/vehicles/types', [VehicleController::class, 'types']);
    Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show']);

    // Admin / Operator / Accountant restricted routes
    Route::middleware('admin.role')->group(function () {
        // Operator Dashboard
        Route::get('/operator/dashboard', [OperatorController::class, 'dashboard']);

        // Vehicles write actions
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update']);
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy']);

        // Drivers CRUD
        Route::apiResource('drivers', DriverController::class);

        // Organizations CRUD
        Route::apiResource('organizations', OrganizationController::class);

        // Taxes CRUD
        Route::apiResource('taxes', TaxController::class);

        // Admin customer / user compatibility routes
        Route::get('/user/customers',             [AuthController::class, 'getCustomers']);
        Route::get('/user/customers/{id}',        [AuthController::class, 'showCustomer']);
        Route::put('/user/customers/{id}/status', [AuthController::class, 'updateCustomerStatus']);
        Route::post('/auth/createUser',           [AuthController::class, 'createUser']);

        // Invoices & Payments (Admin actions)
        Route::post('/invoices/generate-monthly', [InvoiceController::class, 'generateMonthly']);
        Route::post('/payments/{id}/confirm-cash', [InvoiceController::class, 'confirmCash']);
        Route::post('/contracts/{id}/generate-schedule', [ContractController::class, 'generateSchedule']);
    });

    // Contracts CRUD (Scoping done at controller level)
    Route::apiResource('contracts', ContractController::class);

    // Invoices & Payments (Scoping done at controller level)
    Route::post('/invoices/{id}/pay/cash',     [InvoiceController::class, 'payCash']);
    Route::post('/invoices/{id}/pay/offline',  [InvoiceController::class, 'payOffline']);
    Route::get('/payments',                   [InvoiceController::class, 'paymentsIndex']);

    // Bookings (Scoping done at controller level)
    Route::get('/bookings',                   [BookingController::class, 'index']);
    Route::get('/bookings/{id}',              [BookingController::class, 'show']);
    Route::post('/bookings/{id}/accept',      [BookingController::class, 'accept']);
    Route::post('/bookings/{id}/reject',      [BookingController::class, 'reject']);
    Route::post('/bookings/{id}/assign-driver', [BookingController::class, 'assignDriver']);
    Route::post('/ai/booking/parse',          [BookingController::class, 'parseAiBooking']);

    // Drivers Operational Trips (Scoping done at controller level)
    Route::get('/driver/trips',               [TripController::class, 'driverTrips']);
    Route::get('/driver/trips/{id}',           [TripController::class, 'showTrip']);
    Route::post('/driver/trips/{id}/accept',   [TripController::class, 'startTrip']);
    Route::post('/driver/trips/{id}/start',    [TripController::class, 'startTrip']);
    Route::post('/driver/trips/{id}/complete', [TripController::class, 'completeTrip']);
    Route::post('/trips/{id}/locations',       [TripController::class, 'postLocations']);

    // GPS tracking & General Invoices
    Route::get('/bookings/{id}/tracking',     [TripController::class, 'tracking']);
    Route::get('/invoices',                   [InvoiceController::class, 'index']);
    Route::get('/invoices/{id}',              [InvoiceController::class, 'show']);
    Route::get('/invoices/{id}/pdf',          [InvoiceController::class, 'downloadPdf']);
    Route::post('/invoices/{id}/pay/online',   [InvoiceController::class, 'payOnline']);
});
