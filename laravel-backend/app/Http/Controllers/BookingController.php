<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateBookingRequest;
use App\Http\Requests\AssignDriverRequest;
use App\Models\Booking;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Services\DistanceService;
use App\Services\FareCalculationService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Trip;

class BookingController extends Controller
{
    protected DistanceService $distanceService;
    protected FareCalculationService $fareService;
    protected NotificationService $notificationService;

    public function __construct(
        DistanceService $distanceService,
        FareCalculationService $fareService,
        NotificationService $notificationService
    ) {
        $this->distanceService = $distanceService;
        $this->fareService = $fareService;
        $this->notificationService = $notificationService;
    }

    public function estimate(Request $request)
    {
        $request->validate([
            'pickup_location' => 'required|string|max:191',
            'drop_location' => 'required|string|max:191',
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
        ]);

        $vehicle = \App\Models\Vehicle::find($request->vehicle_id);
        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Selected vehicle is invalid.'
            ], 422);
        }

        $distance = $this->distanceService->calculateDistance($request->pickup_location, $request->drop_location);
        $fare = $this->fareService->calculateFare($distance, floatval($vehicle->price_per_km));

        return response()->json([
            'success' => true,
            'estimated_distance_km' => $distance,
            'estimated_fare' => $fare
        ]);
    }

    public function store(CreateBookingRequest $request)
    {
        $user = auth('sanctum')->user();
        
        if ($user) {
            $operatorId = $user->operator_id;
            if (in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
                $userId = null;
                $orgId = $request->organization_id ?: null;
                $bookingType = $orgId ? 'organization' : 'individual';
                $customerName = $request->customer_name;
                $customerMobile = $request->customer_mobile;
            } else {
                $userId = $user->id;
                $orgId = $user->organization_id;
                $bookingType = $user->organization_id ? 'organization' : 'individual';
                $customerName = $user->name;
                $customerMobile = $user->mobile;
            }
        } else {
            $operator = \App\Models\Operator::first();
            $operatorId = $operator ? $operator->id : null;
            $userId = null;
            $orgId = $request->organization_id ?: null;
            $bookingType = $orgId ? 'organization' : 'individual';
            $customerName = $request->customer_name;
            $customerMobile = $request->customer_mobile;
        }

        $vehicle = \App\Models\Vehicle::find($request->vehicle_id);
        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Selected vehicle is invalid.'
            ], 422);
        }

        // Validate vehicle is active
        if ($vehicle->status === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Selected vehicle is currently inactive.'
            ], 422);
        }

        // Validate passenger count does not exceed capacity
        if (intval($request->passenger_count) > intval($vehicle->seating_capacity)) {
            return response()->json([
                'success' => false,
                'message' => "Passenger count ({$request->passenger_count}) exceeds vehicle seating capacity ({$vehicle->seating_capacity})."
            ], 422);
        }

        // Validate booking date and time is not in the past
        $bookingDateTime = \Carbon\Carbon::parse($request->booking_date . ' ' . $request->booking_time);
        if ($bookingDateTime->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'The booking date and time cannot be in the past.'
            ], 422);
        }

        // Validate vehicle is not already booked for overlapping time (Double-Booking Protection)
        $startStr = $request->booking_date . ' ' . $request->booking_time;
        if ($request->filled(['expected_end_date', 'expected_end_time'])) {
            $endStr = $request->expected_end_date . ' ' . $request->expected_end_time;
        } else {
            $endStr = \Carbon\Carbon::parse($startStr)->addHours(2)->toDateTimeString();
        }

        $dateConcat = Booking::concatDateTimeSql('booking_date', 'booking_time');
        $endDateConcat = Booking::concatDateTimeSql('expected_end_date', 'expected_end_time');
        
        $overlap = Booking::where('vehicle_id', $vehicle->id)
            ->whereIn('status', ['pending', 'accepted', 'confirmed', 'started'])
            ->where(function($q) use ($startStr, $endStr, $dateConcat, $endDateConcat) {
                $q->where(\Illuminate\Support\Facades\DB::raw($dateConcat), '<', $endStr)
                  ->where(\Illuminate\Support\Facades\DB::raw($endDateConcat), '>', $startStr);
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'This vehicle is already booked for the selected time.'
            ], 422);
        }

        // 3. Calculate route distance
        $distance = $this->distanceService->calculateDistance($request->pickup_location, $request->drop_location);

        // 4. Calculate estimated fare
        $fare = $this->fareService->calculateFare($distance, floatval($vehicle->price_per_km));

        // Generate booking code
        $bookingCode = 'BK-' . strtoupper(Str::random(6));

        // Parse expected end components
        $expectedEndDateVal = $request->expected_end_date ?: \Carbon\Carbon::parse($startStr)->addHours(2)->format('Y-m-d');
        $expectedEndTimeVal = $request->expected_end_time ?: \Carbon\Carbon::parse($startStr)->addHours(2)->format('H:i:s');

        // Create booking
        $booking = Booking::create([
            'operator_id' => $operatorId,
            'user_id' => $userId,
            'customer_name' => $customerName,
            'customer_mobile' => $customerMobile,
            'organization_id' => $orgId,
            'contract_id' => $request->contract_id ?: null,
            'vehicle_id' => $vehicle->id,
            'booking_code' => $bookingCode,
            'booking_type' => $bookingType,
            'pickup_location' => $request->pickup_location,
            'drop_location' => $request->drop_location,
            'booking_date' => $request->booking_date,
            'booking_time' => $request->booking_time,
            'expected_end_date' => $expectedEndDateVal,
            'expected_end_time' => $expectedEndTimeVal,
            'trip_type' => $request->trip_type,
            'passenger_count' => $request->passenger_count,
            'estimated_distance_km' => $distance,
            'estimated_fare' => $fare,
            'status' => 'pending',
            'customer_notes' => $request->customer_notes,
        ]);

        $bookingDetails = "Dear {$customerName},\n\n"
            . "Your booking request has been initiated successfully. Here are your booking details:\n\n"
            . "Booking Reference : {$bookingCode}\n"
            . "Pickup Location    : {$request->pickup_location}\n"
            . "Drop Location      : {$request->drop_location}\n"
            . "Booking Date       : {$request->booking_date}\n"
            . "Booking Time       : {$request->booking_time}\n"
            . "Passengers         : {$request->passenger_count}\n"
            . "Vehicle Type       : " . ($vehicle ? $vehicle->vehicle_name : 'N/A') . "\n"
            . "Estimated Distance : " . number_format($distance, 2) . " KM\n"
            . "Estimated Fare     : ₹" . number_format($fare, 2) . "\n"
            . "Booking Status     : PENDING APPROVAL\n\n"
            . "We will notify you once a driver has been assigned and the booking is confirmed.\n\n"
            . "Thank you for choosing Grace Cabs!";

        // Send created notification
        if ($user) {
            $this->notificationService->notifyUser(
                $operatorId,
                $user,
                'booking_created',
                'Booking Request Initiated',
                $bookingDetails,
                $booking->id
            );
        } else {
            $this->notificationService->send(
                $operatorId,
                null,
                'booking_created',
                'email',
                'Booking Request Initiated',
                $bookingDetails,
                $booking->id,
                null,
                $customerMobile . '@cabs.com'
            );
            $this->notificationService->send(
                $operatorId,
                null,
                'booking_created',
                'sms',
                'Booking Request Initiated',
                "Your booking request {$bookingCode} for {$request->pickup_location} has been created and is pending approval.",
                $booking->id,
                null,
                $customerMobile
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking request registered successfully.',
            'data' => $booking
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Booking::query();

        // Role-based scoping
        if ($user->role === 'customer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } elseif ($user->role === 'driver') {
            $driver = Driver::where('mobile', $user->mobile)->first();
            if ($driver) {
                $query->where('driver_id', $driver->id);
            } else {
                $query->where('driver_id', null);
            }
        } else {
            // Operator isolation for admin/superadmin/accountant
            $query->where('operator_id', $user->operator_id);
        }

        // Filtering options
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date) {
            $query->where('booking_date', $request->date);
        }
        if ($request->driver_id) {
            $query->where('driver_id', $request->driver_id);
        }
        if ($request->vehicle_id) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        $bookings = $query->with(['customer', 'vehicle', 'driver', 'organization', 'contract'])->get();

        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $query = Booking::where('id', $id);

        if ($user->role === 'customer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } elseif ($user->role === 'driver') {
            $driver = Driver::where('mobile', $user->mobile)->first();
            if ($driver) {
                $query->where('driver_id', $driver->id);
            } else {
                $query->where('driver_id', null);
            }
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        $booking = $query->with(['customer', 'organization', 'vehicle', 'driver', 'passengers', 'trip', 'invoice'])->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $booking
        ]);
    }

    public function accept(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $booking = Booking::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        if ($booking->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Booking cannot be accepted from status: ' . $booking->status
            ], 422);
        }

        DB::transaction(function() use ($booking) {
            $booking->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);
        });

        if ($booking->customer) {
            $this->notificationService->notifyUser(
                $operatorId,
                $booking->customer,
                'booking_accepted',
                'Booking Accepted',
                "Your booking request {$booking->booking_code} has been approved by our dispatch team.",
                $booking->id
            );
        } else {
            $this->notificationService->send(
                $operatorId,
                null,
                'booking_accepted',
                'sms',
                'Booking Accepted',
                "Your booking request {$booking->booking_code} has been approved by our dispatch team.",
                $booking->id,
                null,
                $booking->customer_mobile
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking request accepted.',
            'data' => $booking
        ]);
    }

    public function reject(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $operatorId = $request->user()->operator_id;
        $booking = Booking::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        if ($booking->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Booking cannot be rejected from status: ' . $booking->status
            ], 422);
        }

        DB::transaction(function() use ($booking, $request) {
            $booking->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
            ]);
        });

        if ($booking->customer) {
            $this->notificationService->notifyUser(
                $operatorId,
                $booking->customer,
                'booking_rejected',
                'Booking Rejected',
                "Your booking request {$booking->booking_code} for pickup {$booking->pickup_location} at {$booking->booking_date} {$booking->booking_time} was rejected. Reason: {$request->reason}.",
                $booking->id
            );
        } else {
            $this->notificationService->send(
                $operatorId,
                null,
                'booking_rejected',
                'sms',
                'Booking Rejected',
                "Your booking request {$booking->booking_code} for pickup {$booking->pickup_location} at {$booking->booking_date} {$booking->booking_time} was rejected. Reason: {$request->reason}.",
                $booking->id,
                null,
                $booking->customer_mobile
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking request rejected.',
            'data' => $booking
        ]);
    }

    public function assignDriver(AssignDriverRequest $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $booking = Booking::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        if (!in_array($booking->status, ['pending', 'accepted', 'confirmed', 'scheduled'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking status must be pending, accepted, confirmed, or scheduled to assign driver. Current status: ' . $booking->status
            ], 422);
        }

        // Validate driver and vehicle belong to operator
        $driver = Driver::where('operator_id', $operatorId)->where('id', $request->driver_id)->first();
        
        $vehicleId = $request->vehicle_id ?: $booking->vehicle_id;
        $vehicle = Vehicle::where('operator_id', $operatorId)->where('id', $vehicleId)->first();

        if (!$driver || !$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Selected driver or vehicle is invalid for your operator context.'
            ], 422);
        }

        if ($driver->status !== 'active' || !in_array($vehicle->status, ['active', 'available'])) {
            return response()->json([
                'success' => false,
                'message' => 'Selected driver or vehicle is currently not available.'
            ], 422);
        }

        // Expected end date/time range parsing
        $startStr = $booking->booking_date . ' ' . $booking->booking_time;
        if ($booking->expected_end_date && $booking->expected_end_time) {
            $endStr = $booking->expected_end_date . ' ' . $booking->expected_end_time;
        } else {
            $endStr = \Carbon\Carbon::parse($startStr)->addHours(2)->toDateTimeString();
        }

        $dateConcat = Booking::concatDateTimeSql('booking_date', 'booking_time');
        $endDateConcat = Booking::concatDateTimeSql('expected_end_date', 'expected_end_time');

        // Prevent overlapping active trips (DRIVER_ASSIGNED or STARTED) using range overlap
        $overlappingDriver = Booking::where('driver_id', $driver->id)
            ->whereIn('status', ['confirmed', 'started'])
            ->where('id', '!=', $booking->id)
            ->where(function($q) use ($startStr, $endStr, $dateConcat, $endDateConcat) {
                $q->where(\Illuminate\Support\Facades\DB::raw($dateConcat), '<', $endStr)
                  ->where(\Illuminate\Support\Facades\DB::raw($endDateConcat), '>', $startStr);
            })
            ->exists();

        if ($overlappingDriver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver is unavailable for this time period.'
            ], 422);
        }

        $overlappingVehicle = Booking::where('vehicle_id', $vehicle->id)
            ->whereIn('status', ['pending', 'accepted', 'confirmed', 'started'])
            ->where('id', '!=', $booking->id)
            ->where(function($q) use ($startStr, $endStr, $dateConcat, $endDateConcat) {
                $q->where(\Illuminate\Support\Facades\DB::raw($dateConcat), '<', $endStr)
                  ->where(\Illuminate\Support\Facades\DB::raw($endDateConcat), '>', $startStr);
            })
            ->exists();

        if ($overlappingVehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Selected vehicle is already assigned to another overlapping trip.'
            ], 422);
        }

        $oldDriverId = $booking->driver_id;
        $driverChanged = ($oldDriverId !== null && $oldDriverId !== $driver->id);

        // Generate Start Trip OTP
        $startOtp = (string) mt_rand(1000, 9999);
        \App\Models\Otp::updateOrCreate(
            ['purpose' => "trip_start_{$booking->id}"],
            [
                'user_id' => $booking->user_id,
                'mobile' => $customerMobile ?? '0000000000',
                'otp' => $startOtp,
                'expires_at' => now()->addDays(7),
            ]
        );

        DB::transaction(function() use ($booking, $driver, $vehicle) {
            $booking->update([
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'status' => 'confirmed',
                'driver_assigned_at' => now(),
            ]);

            Trip::updateOrCreate(
                ['booking_id' => $booking->id],
                [
                    'driver_id' => $driver->id,
                    'vehicle_id' => $vehicle->id,
                    'status' => 'assigned',
                    'estimated_distance_km' => $booking->estimated_distance_km,
                ]
            );
        });

        // 1. Notify Customer
        $customerName = $booking->customer ? $booking->customer->name : $booking->customer_name;
        $customerMobile = $booking->customer ? $booking->customer->mobile : $booking->customer_mobile;
        
        $notifyTitle = $driverChanged ? 'Driver Assignment Updated' : 'Driver Assigned to Your Booking';
        
        $notifyBody = $driverChanged
            ? "Dear {$customerName},\n\nYour driver assignment for ride {$booking->booking_code} has been updated. Here are the details:\n\n"
                . "Booking Reference : {$booking->booking_code}\n"
                . "New Driver Name   : {$driver->name}\n"
                . "Driver Mobile     : {$driver->mobile}\n"
                . "Vehicle Assigned   : {$vehicle->vehicle_name} (Number: {$vehicle->vehicle_number})\n"
                . "Scheduled Date     : {$booking->booking_date}\n"
                . "Scheduled Time     : {$booking->booking_time}\n"
                . "Pickup Location    : {$booking->pickup_location}\n"
                . "Drop Location      : {$booking->drop_location}\n"
                . "Start Trip OTP     : {$startOtp} (Share with driver upon boarding)\n\n"
                . "Thank you for riding with Grace Cabs!"
            : "Dear {$customerName},\n\nYour ride booking {$booking->booking_code} has been confirmed. A driver and vehicle have been assigned to your trip:\n\n"
                . "Booking Reference : {$booking->booking_code}\n"
                . "Driver Name       : {$driver->name}\n"
                . "Driver Mobile     : {$driver->mobile}\n"
                . "Vehicle Assigned   : {$vehicle->vehicle_name} (Number: {$vehicle->vehicle_number})\n"
                . "Scheduled Date     : {$booking->booking_date}\n"
                . "Scheduled Time     : {$booking->booking_time}\n"
                . "Pickup Location    : {$booking->pickup_location}\n"
                . "Drop Location      : {$booking->drop_location}\n"
                . "Start Trip OTP     : {$startOtp} (Share with driver upon boarding)\n\n"
                . "Thank you for riding with Grace Cabs!";

        $customerSms = "Grace Cabs: Ride {$booking->booking_code} confirmed. Driver: {$driver->name} ({$driver->mobile}), Vehicle: {$vehicle->vehicle_number}. Start OTP: {$startOtp}";

        if ($booking->customer) {
            $this->notificationService->notifyUser(
                $operatorId,
                $booking->customer,
                'driver_assigned',
                $notifyTitle,
                $notifyBody,
                $booking->id
            );
        } else {
            $this->notificationService->send(
                $operatorId,
                null,
                'driver_assigned',
                'email',
                $notifyTitle,
                $notifyBody,
                $booking->id,
                null,
                $customerMobile . '@cabs.com'
            );
            $this->notificationService->send(
                $operatorId,
                null,
                'driver_assigned',
                'sms',
                $notifyTitle,
                $customerSms,
                $booking->id,
                null,
                $booking->customer_mobile
            );
        }

        // 2. Notify Driver
        $driverUser = \App\Models\User::where('mobile', $driver->mobile)->first();
        $driverNotifyBody = "Dear {$driver->name},\n\nYou have been assigned to a new trip. Here are the details:\n\n"
            . "Booking Reference : {$booking->booking_code}\n"
            . "Customer Name     : {$customerName}\n"
            . "Customer Mobile   : {$customerMobile}\n"
            . "Pickup Location    : {$booking->pickup_location}\n"
            . "Drop Location      : {$booking->drop_location}\n"
            . "Scheduled Date     : {$booking->booking_date}\n"
            . "Scheduled Time     : {$booking->booking_time}\n"
            . "Vehicle Assigned   : {$vehicle->vehicle_name} (Number: {$vehicle->vehicle_number})\n"
            . "Passenger Count    : {$booking->passenger_count}\n\n"
            . "Please make sure to arrive at the pickup location on time.";

        if ($driverUser) {
            $this->notificationService->notifyUser(
                $operatorId,
                $driverUser,
                'driver_assigned',
                'New Trip Assignment',
                $driverNotifyBody,
                $booking->id
            );
        } else {
            $this->notificationService->send(
                $operatorId,
                null,
                'driver_assigned',
                'email',
                'New Trip Assignment',
                $driverNotifyBody,
                $booking->id,
                null,
                $driver->mobile . '@driver.gracecabs.com'
            );
        }

        // 3. Notify Old Driver if reassigned
        if ($driverChanged && $oldDriverId) {
            $oldDriver = Driver::find($oldDriverId);
            if ($oldDriver) {
                $oldDriverUser = \App\Models\User::where('mobile', $oldDriver->mobile)->first();
                $oldDriverNotifyBody = "Dear {$oldDriver->name},\n\nYou have been unassigned from booking {$booking->booking_code}. You are now available for other trip assignments.";
                if ($oldDriverUser) {
                    $this->notificationService->notifyUser(
                        $operatorId,
                        $oldDriverUser,
                        'driver_unassigned',
                        'Trip Assignment Cancelled',
                        $oldDriverNotifyBody,
                        $booking->id
                    );
                } else {
                    $this->notificationService->send(
                        $operatorId,
                        null,
                        'driver_unassigned',
                        'email',
                        'Trip Assignment Cancelled',
                        $oldDriverNotifyBody,
                        $booking->id,
                        null,
                        $oldDriver->mobile . '@driver.gracecabs.com'
                    );
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Driver and vehicle successfully assigned to booking.',
            'data' => $booking
        ]);
    }

    public function parseAiBooking(Request $request)
    {
        $text = $request->input('text', '');
        
        // Simple extraction logic
        $pickup = '';
        $drop = '';
        $date = now()->format('Y-m-d');
        $time = '10:00';
        $travellers = 1;
        $vType = '';
        
        // Match English pattern "[Pickup] to [Drop]"
        if (preg_match('/([a-zA-Z0-9\s]{3,30})\s+to\s+([a-zA-Z0-9\s]{3,30})/i', $text, $matches)) {
            $pickup = trim($matches[1]);
            $drop = trim($matches[2]);
        }
        
        // Match Tomorrow / Today
        if (stripos($text, 'tomorrow') !== false || str_contains($text, 'நாளை')) {
            $date = now()->addDay()->format('Y-m-d');
        } elseif (stripos($text, 'today') !== false || str_contains($text, 'இன்று')) {
            $date = now()->format('Y-m-d');
        }
        
        // Match SUV/Sedan
        if (stripos($text, 'suv') !== false || str_contains($text, 'எஸ்யுவி')) {
            $vType = 'SUV';
        } elseif (stripos($text, 'sedan') !== false || str_contains($text, 'செடான்')) {
            $vType = 'Sedan';
        }
        
        // Match passenger count (e.g. 3 passengers, 4 people)
        if (preg_match('/(\d+)\s*(?:passenger|people|member|நபர்|நபர்கள்)/i', $text, $matches)) {
            $travellers = intval($matches[1]);
        }

        // Return extracted parameters
        return response()->json([
            'success' => true,
            'data' => [
                'bookingType' => 'INDIVIDUAL',
                'pickupPoint' => $pickup ?: 'Airport Departure',
                'dropPoint' => $drop ?: 'City Center Hotel',
                'bookingDate' => $date,
                'bookingTime' => $time,
                'travellersCount' => $travellers,
                'vehicleType' => $vType ?: 'Sedan',
                'remarks' => 'Extracted via SwiftRide AI Voice Assistant',
                'needsClarification' => false,
                'clarificationMessage' => null
            ]
        ]);
    }

    public function publicTrack(Request $request)
    {
        $request->validate([
            'booking_reference' => 'required|string|max:50',
            'mobile' => 'required|string|max:20',
        ]);

        $cleanMobile = preg_replace('/[^0-9]/', '', $request->mobile);

        $booking = Booking::where('booking_code', $request->booking_reference)
            ->where(function ($query) use ($request, $cleanMobile) {
                $query->where('customer_mobile', $request->mobile)
                      ->orWhere('customer_mobile', $cleanMobile)
                      ->orWhereHas('customer', function ($q) use ($request, $cleanMobile) {
                          $q->where('mobile', $request->mobile)
                            ->orWhere('mobile', $cleanMobile);
                      });
            })
            ->with(['vehicle', 'driver', 'invoice'])
            ->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'No booking found matching the provided reference and mobile number.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $booking
        ]);
    }
}
