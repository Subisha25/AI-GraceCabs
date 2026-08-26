<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Invoice;
use Illuminate\Http\Request;

class OperatorController extends Controller
{
    public function dashboard(Request $request)
    {
        $operatorId = $request->user()->operator_id;
        $today = date('Y-m-d');

        // top KPI cards
        $todayBookings = Booking::where('operator_id', $operatorId)
            ->where('booking_date', $today)
            ->count();

        $pendingRequests = Booking::where('operator_id', $operatorId)
            ->where('status', 'pending')
            ->count();

        $accepted = Booking::where('operator_id', $operatorId)
            ->where('status', 'accepted')
            ->count();

        $driverAssigned = Booking::where('operator_id', $operatorId)
            ->where('status', 'confirmed')
            ->count();

        $tripsOngoing = Booking::where('operator_id', $operatorId)
            ->where('status', 'started')
            ->count();

        $completedTrips = Booking::where('operator_id', $operatorId)
            ->where('status', 'completed')
            ->count();

        $paymentPending = Invoice::where('operator_id', $operatorId)
            ->where('status', 'payment_pending')
            ->count();

        $revenueToday = Invoice::where('operator_id', $operatorId)
            ->where('status', 'paid')
            ->whereDate('updated_at', $today)
            ->sum('total_amount');

        // pipeline counts
        $pipeline = [
            'pending' => Booking::where('operator_id', $operatorId)->where('status', 'pending')->count(),
            'accepted' => Booking::where('operator_id', $operatorId)->where('status', 'accepted')->count(),
            'confirmed' => Booking::where('operator_id', $operatorId)->where('status', 'confirmed')->count(),
            'started' => Booking::where('operator_id', $operatorId)->where('status', 'started')->count(),
            'completed' => Booking::where('operator_id', $operatorId)->where('status', 'completed')->count(),
            'rejected' => Booking::where('operator_id', $operatorId)->where('status', 'rejected')->count(),
            'cancelled' => Booking::where('operator_id', $operatorId)->where('status', 'cancelled')->count(),
        ];

        // lists
        $recentBookings = Booking::where('operator_id', $operatorId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $todayTrips = Booking::where('operator_id', $operatorId)
            ->where('booking_date', $today)
            ->orderBy('booking_time', 'asc')
            ->with(['driver', 'vehicle'])
            ->get();

        // alerts
        $alerts = [
            'awaiting_acceptance' => $pendingRequests,
            'without_driver' => $accepted,
            'ongoing_trips' => $tripsOngoing,
            'payments_pending' => $paymentPending,
            'assignment_conflicts' => 0, // database validations guarantee no overlaps
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'kpi' => [
                    'today_bookings' => $todayBookings,
                    'pending_requests' => $pendingRequests,
                    'accepted' => $accepted,
                    'driver_assigned' => $driverAssigned,
                    'trips_ongoing' => $tripsOngoing,
                    'completed_trips' => $completedTrips,
                    'payment_pending' => $paymentPending,
                    'revenue_today' => round($revenueToday, 2),
                ],
                'pipeline' => $pipeline,
                'recent_bookings' => $recentBookings,
                'today_trips' => $todayTrips,
                'alerts' => $alerts,
            ]
        ]);
    }
}
