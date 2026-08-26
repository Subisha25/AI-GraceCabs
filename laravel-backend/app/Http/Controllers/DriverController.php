<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\DriverRequest;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $operatorId = $request->user()->operator_id;
        $query = Driver::where('operator_id', $operatorId)->where('status', 'active');

        if ($request->has(['start_at', 'end_at'])) {
            $start = $request->start_at;
            $end = $request->end_at;
            $excludeBookingId = $request->exclude_booking_id;

            $dateConcat = \App\Models\Booking::concatDateTimeSql('booking_date', 'booking_time');
            $endDateConcat = \App\Models\Booking::concatDateTimeSql('expected_end_date', 'expected_end_time');

            $overlappingDriverIds = \App\Models\Booking::whereNotNull('driver_id')
                ->whereIn('status', ['confirmed', 'started'])
                ->when($excludeBookingId, function ($q) use ($excludeBookingId) {
                    return $q->where('id', '!=', $excludeBookingId);
                })
                ->where(function($q) use ($start, $end, $dateConcat, $endDateConcat) {
                    $q->where(\Illuminate\Support\Facades\DB::raw($dateConcat), '<', $end)
                      ->where(\Illuminate\Support\Facades\DB::raw($endDateConcat), '>', $start);
                })
                ->pluck('driver_id')
                ->toArray();

            $query->whereNotIn('id', $overlappingDriverIds);
        }

        $drivers = $query->get();

        $drivers = $drivers->map(function ($driver) {
            $activeBooking = \App\Models\Booking::where('driver_id', $driver->id)
                ->whereIn('status', ['confirmed', 'started'])
                ->with('vehicle')
                ->first();

            $driver->assigned_vehicle = $activeBooking && $activeBooking->vehicle ? $activeBooking->vehicle->vehicle_type : null;
            $driver->vehicle_number = $activeBooking && $activeBooking->vehicle ? $activeBooking->vehicle->vehicle_number : null;
            $driver->current_booking_code = $activeBooking ? $activeBooking->booking_code : null;
            
            // Availability statuses: AVAILABLE, ASSIGNED, ON_TRIP, OFFLINE, INACTIVE
            if ($driver->status === 'inactive') {
                $driver->availability = 'INACTIVE';
            } elseif ($activeBooking) {
                $driver->availability = ($activeBooking->status === 'started') ? 'ON_TRIP' : 'ASSIGNED';
            } else {
                $driver->availability = 'AVAILABLE';
            }

            return $driver;
        });

        return response()->json([
            'success' => true,
            'data' => $drivers
        ]);
    }

    public function store(DriverRequest $request)
    {
        $operatorId = $request->user()->operator_id;

        $driver = Driver::create(array_merge(
            $request->validated(),
            [
                'operator_id' => $operatorId,
                'password' => $request->password ? Hash::make($request->password) : null
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Driver registered successfully.',
            'data' => $driver
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $driver = Driver::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $driver
        ]);
    }

    public function update(DriverRequest $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $driver = Driver::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver not found.'
            ], 404);
        }

        $data = $request->validated();
        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        } else {
            unset($data['password']);
        }

        $driver->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Driver updated successfully.',
            'data' => $driver
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $driver = Driver::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver not found.'
            ], 404);
        }

        $activeBooking = \App\Models\Booking::where('driver_id', $driver->id)
            ->whereIn('status', ['confirmed', 'started'])
            ->exists();

        if ($activeBooking) {
            return response()->json([
                'success' => false,
                'message' => 'This driver is currently assigned to an active trip and cannot be deleted.'
            ], 422);
        }

        $driver->update(['status' => 'inactive']);

        return response()->json([
            'success' => true,
            'message' => 'Driver removed successfully.'
        ]);
    }
}
