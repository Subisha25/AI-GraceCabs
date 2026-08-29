<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteTripRequest;
use App\Models\Booking;
use App\Models\Trip;
use App\Models\TripLocation;
use App\Models\Invoice;
use App\Models\Driver;
use App\Services\DistanceService;
use App\Services\FareCalculationService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TripController extends Controller
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

    public function driverTrips(Request $request)
    {
        $user = $request->user();
        
        // Find driver profile by matching name or mobile
        $driver = Driver::where('mobile', $user->mobile)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver record not found.'], 404);
        }

        // Return bookings assigned to the driver
        $bookings = Booking::where('driver_id', $driver->id)->with(['trip'])->get();

        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    public function showTrip(Request $request, $id)
    {
        $user = $request->user();
        $driver = Driver::where('mobile', $user->mobile)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver record not found.'], 404);
        }

        $booking = Booking::where('driver_id', $driver->id)
            ->where('id', $id)
            ->with(['trip', 'passengers', 'customer', 'vehicle'])
            ->first();

        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $booking
        ]);
    }

    public function startTrip(Request $request, $id)
    {
        $user = $request->user();
        $driver = Driver::where('mobile', $user->mobile)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver record not found.'], 404);
        }

        $booking = Booking::where('driver_id', $driver->id)->where('id', $id)->first();
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found.'], 404);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json(['success' => false, 'message' => 'Cannot start trip from status: ' . $booking->status], 422);
        }

        $trip = null;
        DB::transaction(function() use ($booking, $driver, $request, &$trip) {
            $trip = Trip::updateOrCreate(
                ['booking_id' => $booking->id],
                [
                    'driver_id' => $driver->id,
                    'vehicle_id' => $booking->vehicle_id,
                    'status' => 'started',
                    'started_at' => now(),
                    'start_latitude' => $request->latitude ?? null,
                    'start_longitude' => $request->longitude ?? null,
                ]
            );

            $booking->update([
                'status' => 'started',
                'started_at' => now(),
            ]);
        });

        $customerName = $booking->customer ? $booking->customer->name : $booking->customer_name;
        $vehicle = $booking->vehicle;
        
        $customerStartNotify = "Dear {$customerName},\n\nYour ride has started. Below are your driver and trip details:\n\n"
            . "Booking Reference : {$booking->booking_code}\n"
            . "Driver Name       : " . ($driver ? $driver->name : 'N/A') . "\n"
            . "Vehicle Assigned   : " . ($vehicle ? $vehicle->vehicle_name : 'N/A') . " (Number: " . ($vehicle ? $vehicle->vehicle_number : 'N/A') . ")\n"
            . "Pickup Location    : {$booking->pickup_location}\n"
            . "Drop Location      : {$booking->drop_location}\n"
            . "Start Time         : " . now()->format('Y-m-d H:i:s') . "\n\n"
            . "You can track the live progress in your dashboard.";

        $driverStartNotify = "Dear " . ($driver ? $driver->name : 'Driver') . ",\n\n"
            . "Trip started confirmation for booking {$booking->booking_code} has been successfully logged.\n\n"
            . "Please drive safely!";

        if ($booking->customer) {
            $this->notificationService->notifyUser(
                $booking->operator_id,
                $booking->customer,
                'trip_started',
                'Your Ride Has Started',
                $customerStartNotify,
                $booking->id
            );
        } else {
            $this->notificationService->send(
                $booking->operator_id,
                null,
                'trip_started',
                'email',
                'Your Ride Has Started',
                $customerStartNotify,
                $booking->id,
                null,
                $booking->customer_mobile . '@cabs.com'
            );
            $this->notificationService->send(
                $booking->operator_id,
                null,
                'trip_started',
                'sms',
                'Your Ride Has Started',
                "Your ride {$booking->booking_code} has started. Track here: " . url('/track-booking'),
                $booking->id,
                null,
                $booking->customer_mobile
            );
        }

        // Notify Driver
        $driverUser = $driver ? \App\Models\User::where('mobile', $driver->mobile)->first() : null;
        if ($driverUser) {
            $this->notificationService->notifyUser(
                $booking->operator_id,
                $driverUser,
                'trip_started',
                'Trip Started Confirmed',
                $driverStartNotify,
                $booking->id
            );
        } else if ($driver) {
            $this->notificationService->send(
                $booking->operator_id,
                null,
                'trip_started',
                'email',
                'Trip Started Confirmed',
                $driverStartNotify,
                $booking->id,
                null,
                $driver->mobile . '@driver.gracecabs.com'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Trip started successfully.',
            'data' => $trip
        ]);
    }

    public function postLocations(CompleteTripRequest $request, $id)
    {
        $user = $request->user();
        $driver = Driver::where('mobile', $user->mobile)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver record not found.'], 404);
        }

        // Find trip by booking_id or trip_id and ensure it belongs to this driver
        $trip = Trip::where(function($q) use ($id) {
            $q->where('booking_id', $id)->orWhere('id', $id);
        })->where('driver_id', $driver->id)->first();

        if (!$trip) {
            return response()->json(['success' => false, 'message' => 'Trip not found or does not belong to driver.'], 404);
        }

        $loc = TripLocation::create([
            'trip_id' => $trip->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Location logged successfully.',
            'data' => $loc
        ]);
    }

    public function tracking(Request $request, $id)
    {
        $user = $request->user();
        
        $booking = Booking::where('id', $id)->with(['driver', 'vehicle'])->first();
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found.'], 404);
        }

        // Customer can only track their own booking
        if ($user->role === 'customer' && $booking->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $trip = $booking->trip;
        if (!$trip) {
            return response()->json(['success' => false, 'message' => 'No operational trip active.'], 404);
        }

        // Fetch latest coordinates
        $latest = TripLocation::where('trip_id', $trip->id)->orderBy('recorded_at', 'DESC')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'booking_code' => $booking->booking_code,
                'status' => $booking->status,
                'latitude' => $latest ? $latest->latitude : $trip->start_latitude,
                'longitude' => $latest ? $latest->longitude : $trip->start_longitude,
                'recorded_at' => $latest ? $latest->recorded_at : $trip->started_at,
                'driver_name' => $booking->driver ? $booking->driver->name : 'N/A',
                'driver_mobile' => $booking->driver ? $booking->driver->mobile : 'N/A',
                'vehicle_number' => $booking->vehicle ? $booking->vehicle->vehicle_number : 'N/A',
                'vehicle_name' => $booking->vehicle ? $booking->vehicle->vehicle_name : 'N/A',
            ]
        ]);
    }

    public function completeTrip(CompleteTripRequest $request, $id)
    {
        $user = $request->user();
        $driver = Driver::where('mobile', $user->mobile)->first();
        if (!$driver) {
            return response()->json(['success' => false, 'message' => 'Driver record not found.'], 404);
        }

        // Find trip by booking_id or trip_id
        $trip = Trip::where('booking_id', $id)->orWhere('id', $id)->first();
        if (!$trip) {
            return response()->json(['success' => false, 'message' => 'Trip not found.'], 404);
        }

        $booking = $trip->booking;
        if ($booking->driver_id !== $driver->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized driver.'], 403);
        }

        if ($booking->status !== 'started') {
            return response()->json(['success' => false, 'message' => 'Cannot complete trip from status: ' . $booking->status], 422);
        }

        $completedAt = now();
        $durationSeconds = $completedAt->diffInSeconds($booking->started_at ?? now());

        // Calculate actual distance using TripDistanceService
        $locations = TripLocation::where('trip_id', $trip->id)->get();
        $tripDistanceService = new \App\Services\TripDistanceService();
        $actualDistance = $tripDistanceService->calculateDistance($locations);

        if ($actualDistance < 0) {
            // Fallback policy: Use estimated distance
            $actualDistance = floatval($booking->estimated_distance_km);
            \Illuminate\Support\Facades\Log::info("Insufficient GPS points logged for booking {$booking->id}. Falling back to estimated distance: {$actualDistance} km.");
        }

        // Calculate final fare using backend Fare Calculation Service
        $pricePerKm = $booking->vehicle ? $booking->vehicle->price_per_km : 20.00;
        $finalFare = $this->fareService->calculateFare($actualDistance, floatval($pricePerKm));
        $tax = $this->fareService->calculateTax($finalFare);

        $invoice = null;
        DB::transaction(function() use ($booking, $trip, $request, $actualDistance, $durationSeconds, $completedAt, $finalFare, $tax, &$invoice) {
            $trip->update([
                'status' => 'completed',
                'completed_at' => $completedAt,
                'end_latitude' => $request->latitude ?? null,
                'end_longitude' => $request->longitude ?? null,
                'actual_distance_km' => $actualDistance,
                'duration_seconds' => $durationSeconds,
            ]);

            $booking->update([
                'status' => 'completed',
                'completed_at' => $completedAt,
                'actual_distance_km' => $actualDistance,
                'final_fare' => $finalFare,
            ]);

            // Automatically create Invoice
            $year = date('Y');
            $lastInvoice = Invoice::where('invoice_number', 'like', "INV-{$year}-%")
                ->orderBy('invoice_number', 'desc')
                ->lockForUpdate()
                ->first();
            $nextSequence = 1;
            if ($lastInvoice) {
                $parts = explode('-', $lastInvoice->invoice_number);
                if (count($parts) === 3) {
                    $nextSequence = intval($parts[2]) + 1;
                }
            }
            $invoiceNumber = 'INV-' . $year . '-' . str_pad($nextSequence, 6, '0', STR_PAD_LEFT);
            $totalAmount = $finalFare + $tax;

            $invoice = Invoice::create([
                'operator_id' => $booking->operator_id,
                'booking_id' => $booking->id,
                'invoice_number' => $invoiceNumber,
                'invoice_type' => 'individual',
                'subtotal' => $finalFare,
                'tax_amount' => $tax,
                'total_amount' => $totalAmount,
                'status' => 'payment_pending',
                'issued_at' => now(),
            ]);
        });

        // Generate and save PDF first
        $pdfPath = null;
        try {
            $pdfService = app(\App\Services\InvoicePdfService::class);
            $pdfPath = $pdfService->savePdf($invoice);
        $invoice->update(['pdf_path' => $pdfPath]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to generate/save PDF invoice: " . $e->getMessage());
        }

        // Build detailed email message
        $tripDurationFormatted = gmdate("H:i:s", $durationSeconds);
        $pricePerKm = $booking->vehicle ? $booking->vehicle->price_per_km : 20.00;
        $customerName = $booking->customer ? $booking->customer->name : $booking->customer_name;
        $customerMobile = $booking->customer ? $booking->customer->mobile : $booking->customer_mobile;
        $vehicleName = $booking->vehicle ? $booking->vehicle->vehicle_name : 'N/A';
        $driverName = $booking->driver ? $booking->driver->name : 'N/A';
        
        $detailedMessage = "Dear {$customerName},\n\n"
            . "Your ride has been completed successfully. Below is your detailed trip and billing summary:\n\n"
            . "--------------------------------------------------\n"
            . "TRIP & VEHICLE INFORMATION\n"
            . "--------------------------------------------------\n"
            . "Booking Reference : {$booking->booking_code}\n"
            . "Invoice Number     : {$invoice->invoice_number}\n"
            . "Vehicle Assigned   : {$vehicleName} (Number: " . ($booking->vehicle ? $booking->vehicle->vehicle_number : 'N/A') . ")\n"
            . "Driver Assigned    : {$driverName}\n"
            . "Pickup Location    : {$booking->pickup_location}\n"
            . "Drop Location      : {$booking->drop_location}\n"
            . "Start Time         : " . ($booking->started_at ? \Carbon\Carbon::parse($booking->started_at)->format('Y-m-d H:i:s') : 'N/A') . "\n"
            . "End Time           : " . ($completedAt ? \Carbon\Carbon::parse($completedAt)->format('Y-m-d H:i:s') : 'N/A') . "\n"
            . "Trip Duration      : {$tripDurationFormatted}\n\n"
            . "--------------------------------------------------\n"
            . "FARE & BILLING BREAKDOWN\n"
            . "--------------------------------------------------\n"
            . "Actual Distance    : " . number_format($actualDistance, 2) . " KM\n"
            . "Rate per KM        : ₹" . number_format($pricePerKm, 2) . "\n"
            . "Base Fare          : ₹" . number_format($finalFare, 2) . "\n"
            . "Taxes (CGST/SGST)  : ₹" . number_format($tax, 2) . "\n"
            . "Total Amount Due   : ₹" . number_format($invoice->total_amount, 2) . "\n"
            . "Payment Status     : " . strtoupper($invoice->status) . "\n\n"
            . "The PDF copy of your invoice is attached to this email.\n\n"
            . "Thank you for riding with Grace Cabs!";

        // Send completed notification
        if ($booking->customer) {
            $this->notificationService->notifyUser(
                $booking->operator_id,
                $booking->customer,
                'trip_completed',
                'Trip Invoice Generated',
                $detailedMessage,
                $booking->id,
                $invoice->id,
                $pdfPath
            );
        } else {
            $this->notificationService->send(
                $booking->operator_id,
                null,
                'trip_completed',
                'email',
                'Trip Invoice Generated',
                $detailedMessage,
                $booking->id,
                $invoice->id,
                null,
                $customerMobile . '@cabs.com',
                $pdfPath
            );
            $this->notificationService->send(
                $booking->operator_id,
                null,
                'trip_completed',
                'sms',
                'Trip Invoice Generated',
                "Your ride {$booking->booking_code} has ended. Invoice: {$invoice->invoice_number}. Total billing amount is ₹" . number_format($invoice->total_amount, 2),
                $booking->id,
                $invoice->id,
                $booking->customer_mobile,
                $pdfPath
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Trip completed and invoice generated successfully.',
            'data' => [
                'trip' => $trip,
                'invoice' => $invoice
            ]
        ]);
    }
}
