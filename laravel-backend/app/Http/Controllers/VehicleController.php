<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $operatorId = $user->operator_id;

        if (!$operatorId) {
            $operator = \App\Models\Operator::first();
            $operatorId = $operator ? $operator->id : null;
        }

        $query = Vehicle::where('operator_id', $operatorId);

        // Customers see only active or available vehicles
        if ($user && !in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            $query->whereIn('status', ['active', 'available']);
        }

        $vehicles = $query->get();

        return response()->json([
            'success' => true,
            'data' => $vehicles
        ]);
    }

    public function store(Request $request)
    {
        $operatorId = $request->user()->operator_id;

        $validated = $request->validate([
            'vehicle_type' => 'required|string|max:50',
            'vehicle_number' => 'required|string|max:20',
            'seating_capacity' => 'required|integer|min:1',
            'price_per_km' => 'required|numeric|min:0',
            'image' => 'nullable',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'status' => 'required|string|in:active,inactive,available,busy,maintenance',
        ]);

        // Scoped uniqueness verification
        $exists = Vehicle::where('operator_id', $operatorId)
            ->where('vehicle_number', $request->vehicle_number)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => ['vehicle_number' => ['The vehicle number has already been taken for this operator.']]
            ], 422);
        }

        // Handle uploaded image file if present
        $imagePath = null;
        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/vehicles');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $imagePath = '/uploads/vehicles/' . $filename;
        } elseif ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/vehicles');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $imagePath = '/uploads/vehicles/' . $filename;
        } elseif (is_string($request->input('image')) && !empty($request->input('image'))) {
            $imagePath = $request->input('image');
        }

        unset($validated['image_file']);
        $validated['image'] = $imagePath;

        $vehicle = Vehicle::create(array_merge(
            $validated,
            ['operator_id' => $operatorId]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Vehicle registered successfully.',
            'data' => $vehicle
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $operatorId = $user->operator_id;

        if (!$operatorId) {
            $operator = \App\Models\Operator::first();
            $operatorId = $operator ? $operator->id : null;
        }

        $query = Vehicle::where('operator_id', $operatorId)->where('id', $id);

        // Customers see only active or available vehicles
        if ($user && !in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            $query->whereIn('status', ['active', 'available']);
        }

        $vehicle = $query->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $vehicle
        ]);
    }

    public function update(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $vehicle = Vehicle::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found.'
            ], 404);
        }

        $validated = $request->validate([
            'vehicle_type' => 'required|string|max:50',
            'vehicle_number' => 'required|string|max:20',
            'seating_capacity' => 'required|integer|min:1',
            'price_per_km' => 'required|numeric|min:0',
            'image' => 'nullable',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'status' => 'required|string|in:active,inactive,available,busy,maintenance',
        ]);

        // Scoped uniqueness validation
        $exists = Vehicle::where('operator_id', $operatorId)
            ->where('vehicle_number', $request->vehicle_number)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => ['vehicle_number' => ['The vehicle number has already been taken for this operator.']]
            ], 422);
        }

        // Handle uploaded image file replacement if present
        $imagePath = $vehicle->image;
        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/vehicles');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            
            // Delete old file if present
            if ($vehicle->image && file_exists(public_path($vehicle->image))) {
                @unlink(public_path($vehicle->image));
            }
            $imagePath = '/uploads/vehicles/' . $filename;
        } elseif ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/vehicles');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);

            // Delete old file if present
            if ($vehicle->image && file_exists(public_path($vehicle->image))) {
                @unlink(public_path($vehicle->image));
            }
            $imagePath = '/uploads/vehicles/' . $filename;
        } elseif ($request->has('image') && is_string($request->input('image'))) {
            $imagePath = $request->input('image');
        }

        unset($validated['image_file']);
        $validated['image'] = $imagePath;

        $vehicle->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully.',
            'data' => $vehicle
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $vehicle = Vehicle::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found.'
            ], 404);
        }

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle removed successfully.'
        ]);
    }

    public function publicList()
    {
        $operator = \App\Models\Operator::first();
        $operatorId = $operator ? $operator->id : null;

        $vehicles = Vehicle::whereIn('status', ['active', 'available'])
            ->when($operatorId, function ($query) use ($operatorId) {
                return $query->where('operator_id', $operatorId);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vehicles
        ]);
    }

    public function available(Request $request)
    {
        $user = $request->user();
        $operatorId = $user ? $user->operator_id : null;

        if (!$operatorId) {
            $operator = \App\Models\Operator::first();
            $operatorId = $operator ? $operator->id : null;
        }

        $query = Vehicle::where('operator_id', $operatorId)->where('status', 'active');

        if ($request->has('vehicle_type_name') && $request->vehicle_type_name !== '') {
            $query->where('vehicle_type', $request->vehicle_type_name);
        }

        if ($request->has('passenger_count') && $request->passenger_count !== '') {
            $query->where('seating_capacity', '>=', intval($request->passenger_count));
        }

        if ($request->has(['start_at', 'end_at'])) {
            $start = $request->start_at;
            $end = $request->end_at;
            $excludeBookingId = $request->exclude_booking_id;

            $dateConcat = \App\Models\Booking::concatDateTimeSql('booking_date', 'booking_time');
            $endDateConcat = \App\Models\Booking::concatDateTimeSql('expected_end_date', 'expected_end_time');

            $overlappingVehicleIds = \App\Models\Booking::whereNotNull('vehicle_id')
                ->whereIn('status', ['pending', 'accepted', 'confirmed', 'started'])
                ->when($excludeBookingId, function ($q) use ($excludeBookingId) {
                    return $q->where('id', '!=', $excludeBookingId);
                })
                ->where(function($q) use ($start, $end, $dateConcat, $endDateConcat) {
                    $q->where(\Illuminate\Support\Facades\DB::raw($dateConcat), '<', $end)
                      ->where(\Illuminate\Support\Facades\DB::raw($endDateConcat), '>', $start);
                })
                ->pluck('vehicle_id')
                ->toArray();

            $query->whereNotIn('id', $overlappingVehicleIds);
        }

        $vehicles = $query->get();

        return response()->json([
            'success' => true,
            'data' => $vehicles
        ]);
    }

    public function types(Request $request)
    {
        $user = $request->user();
        $operatorId = $user ? $user->operator_id : null;

        if (!$operatorId) {
            $operator = \App\Models\Operator::first();
            $operatorId = $operator ? $operator->id : null;
        }

        $types = Vehicle::where('operator_id', $operatorId)
            ->where('status', 'active')
            ->distinct()
            ->pluck('vehicle_type');

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }
}
