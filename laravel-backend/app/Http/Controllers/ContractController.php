<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContractRequest;
use App\Models\Contract;
use App\Models\Organization;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'manager') {
            $contracts = Contract::where('organization_id', $user->organization_id)
                ->with(['organization', 'vehicle', 'stops', 'contractTaxes'])
                ->get();
        } else {
            $contracts = Contract::where('operator_id', $user->operator_id)
                ->with(['organization', 'vehicle', 'stops', 'contractTaxes'])
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $contracts
        ]);
    }

    public function store(ContractRequest $request)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;

        // Tenant validations
        $org = Organization::where('operator_id', $operatorId)->where('id', $request->organization_id)->first();
        if (!$org) {
            return response()->json([
                'success' => false,
                'message' => 'Organization does not belong to the active operator scope.'
            ], 422);
        }

        if ($request->filled('vehicle_id')) {
            $vehicle = Vehicle::where('operator_id', $operatorId)->where('id', $request->vehicle_id)->first();
            if (!$vehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle does not belong to the active operator scope.'
                ], 422);
            }
        }

        // Overlap validation for active contracts
        if (in_array(strtolower($request->status), ['active'])) {
            $overlap = Contract::where('organization_id', $request->organization_id)
                ->whereIn('status', ['active', 'ACTIVE'])
                ->where(function ($q) use ($request) {
                    $q->where('start_date', '<=', $request->end_date)
                      ->where('end_date', '>=', $request->start_date);
                })
                ->exists();

            if ($overlap) {
                return response()->json([
                    'success' => false,
                    'message' => 'An active contract already exists for this organization in the specified period.'
                ], 422);
            }
        }

        $contract = Contract::create(array_merge(
            $request->validated(),
            ['operator_id' => $operatorId]
        ));

        $this->syncStopsAndTaxes($contract, $request);

        return response()->json([
            'success' => true,
            'message' => 'Contract registered successfully.',
            'data' => $contract->load(['stops', 'contractTaxes'])
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $query = Contract::query();

        if ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        $contract = $query->where('id', $id)
            ->with([
                'organization',
                'vehicle',
                'bookings.vehicle',
                'bookings.driver',
                'invoices.payments',
                'stops',
                'contractTaxes'
            ])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $contract
        ]);
    }

    public function update(ContractRequest $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $contract = Contract::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found.'
            ], 404);
        }

        // Tenant validations
        $org = Organization::where('operator_id', $operatorId)->where('id', $request->organization_id)->first();
        if (!$org) {
            return response()->json([
                'success' => false,
                'message' => 'Organization does not belong to the active operator scope.'
            ], 422);
        }

        if ($request->filled('vehicle_id')) {
            $vehicle = Vehicle::where('operator_id', $operatorId)->where('id', $request->vehicle_id)->first();
            if (!$vehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle does not belong to the active operator scope.'
                ], 422);
            }
        }

        // Overlap validation for active contracts
        if (in_array(strtolower($request->status), ['active'])) {
            $overlap = Contract::where('organization_id', $request->organization_id)
                ->where('id', '!=', $id)
                ->whereIn('status', ['active', 'ACTIVE'])
                ->where(function ($q) use ($request) {
                    $q->where('start_date', '<=', $request->end_date)
                      ->where('end_date', '>=', $request->start_date);
                })
                ->exists();

            if ($overlap) {
                return response()->json([
                    'success' => false,
                    'message' => 'An active contract already exists for this organization in the specified period.'
                ], 422);
            }
        }

        $contract->update($request->validated());

        $this->syncStopsAndTaxes($contract, $request);

        return response()->json([
            'success' => true,
            'message' => 'Contract updated successfully.',
            'data' => $contract->load(['stops', 'contractTaxes'])
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $contract = Contract::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found.'
            ], 404);
        }

        $contract->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contract removed successfully.'
        ]);
    }

    public function generateSchedule(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'billing_period' => 'required|string|regex:/^\d{4}-\d{2}$/'
        ]);

        $operatorId = $user->operator_id;
        $contract = Contract::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found.'
            ], 404);
        }

        if (strtolower($contract->status) !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Contract must be ACTIVE to generate schedules.'
            ], 422);
        }

        $billingPeriod = $request->billing_period; // "2026-08"

        // Determine bounds of selected month
        $startOfMonth = \Carbon\Carbon::parse($billingPeriod . '-01')->startOfMonth();
        $endOfMonth = \Carbon\Carbon::parse($billingPeriod . '-01')->endOfMonth();

        $contractStart = \Carbon\Carbon::parse($contract->start_date);
        $contractEnd = \Carbon\Carbon::parse($contract->end_date);

        // Check intersection
        if ($contractStart->gt($endOfMonth) || $contractEnd->lt($startOfMonth)) {
            return response()->json([
                'success' => false,
                'message' => 'The selected billing period does not overlap with the contract validity period.'
            ], 422);
        }

        $targetStart = $contractStart->gt($startOfMonth) ? $contractStart : $startOfMonth;
        $targetEnd = $contractEnd->lt($endOfMonth) ? $contractEnd : $endOfMonth;

        // Parse service days ISO numbers
        $dayMap = [
            'monday'    => 1, 'mon' => 1,
            'tuesday'   => 2, 'tue' => 2,
            'wednesday' => 3, 'wed' => 3,
            'thursday'  => 4, 'thu' => 4,
            'friday'    => 5, 'fri' => 5,
            'saturday'  => 6, 'sat' => 6,
            'sunday'    => 7, 'sun' => 7,
        ];
        $allowedDays = [];
        $serviceDaysStr = strtolower(trim($contract->service_days));
        if (str_contains($serviceDaysStr, '-')) {
            $parts = explode('-', $serviceDaysStr);
            if (count($parts) === 2) {
                $startDayNum = $dayMap[trim($parts[0])] ?? null;
                $endDayNum = $dayMap[trim($parts[1])] ?? null;
                if ($startDayNum !== null && $endDayNum !== null) {
                    if ($startDayNum <= $endDayNum) {
                        for ($d = $startDayNum; $d <= $endDayNum; $d++) {
                            $allowedDays[] = $d;
                        }
                    } else {
                        for ($d = $startDayNum; $d <= 7; $d++) {
                            $allowedDays[] = $d;
                        }
                        for ($d = 1; $d <= $endDayNum; $d++) {
                            $allowedDays[] = $d;
                        }
                    }
                }
            }
        } else {
            $normalized = str_replace([' ', ';'], ',', $serviceDaysStr);
            $parts = explode(',', $normalized);
            foreach ($parts as $p) {
                $p = trim($p);
                if (isset($dayMap[$p])) {
                    $allowedDays[] = $dayMap[$p];
                }
            }
        }
        $allowedDays = array_unique($allowedDays);
        if (empty($allowedDays)) {
            $allowedDays = [1, 2, 3, 4, 5];
        }

        // Get the starting sequence number once
        $latestBooking = \App\Models\Booking::where('booking_code', 'like', 'BK-CTR-%')
            ->orderBy('booking_code', 'desc')
            ->first();
        $nextNum = 1;
        if ($latestBooking) {
            $codeParts = explode('-', $latestBooking->booking_code);
            if (count($codeParts) === 3) {
                $nextNum = ((int) $codeParts[2]) + 1;
            }
        }

        // Loop dates in range
        $current = $targetStart->copy();
        $generatedCount = 0;
        $skippedCount = 0;

        while ($current->lte($targetEnd)) {
            $isoDay = $current->dayOfWeek === 0 ? 7 : $current->dayOfWeek;
            
            if (in_array($isoDay, $allowedDays)) {
                $dateStr = $current->toDateString();

                // Check duplicate booking for this contract on this date
                $exists = \App\Models\Booking::where('contract_id', $contract->id)
                    ->where('booking_date', $dateStr)
                    ->exists();

                if (!$exists) {
                    $bookingCode = 'BK-CTR-' . str_pad((string) $nextNum, 6, '0', STR_PAD_LEFT);
                    $nextNum++;

                    \App\Models\Booking::create([
                        'operator_id' => $operatorId,
                        'organization_id' => $contract->organization_id,
                        'contract_id' => $contract->id,
                        'vehicle_id' => $contract->vehicle_id,
                        'booking_code' => $bookingCode,
                        'booking_type' => 'organization',
                        'pickup_location' => $contract->pickup_location ?: 'N/A',
                        'drop_location' => $contract->drop_location ?: 'N/A',
                        'booking_date' => $dateStr,
                        'booking_time' => '08:00:00', // default daily run time
                        'expected_end_date' => $dateStr,
                        'expected_end_time' => '10:00:00',
                        'trip_type' => 'one_way',
                        'passenger_count' => 1,
                        'estimated_distance_km' => $contract->km_per_day ?: 0.00,
                        'estimated_fare' => 0.00,
                        'status' => 'pending'
                    ]);
                    $generatedCount++;
                } else {
                    $skippedCount++;
                }
            }
            $current->addDay();
        }

        return response()->json([
            'success' => true,
            'message' => "Schedule generation completed. Generated: {$generatedCount} booking(s), Skipped (already exist): {$skippedCount} booking(s)."
        ]);
    }

    private function syncStopsAndTaxes(Contract $contract, Request $request)
    {
        // 1. Sync Stops
        if ($request->has('stops')) {
            $contract->stops()->delete();
            $stops = $request->stops ?: [];
            foreach ($stops as $idx => $stopData) {
                $contract->stops()->create([
                    'stop_name' => $stopData['stop_name'],
                    'address' => $stopData['address'],
                    'latitude' => $stopData['latitude'] ?? null,
                    'longitude' => $stopData['longitude'] ?? null,
                    'sequence' => $stopData['sequence'] ?? ($idx + 1),
                ]);
            }
        }

        // 2. Sync Taxes
        $org = $contract->organization;
        if ($org && $org->allow_tax) {
            if ($request->has('taxes')) {
                $contract->contractTaxes()->delete();
                $taxIds = $request->taxes ?: [];
                foreach ($taxIds as $taxId) {
                    $taxMaster = \App\Models\Tax::find($taxId);
                    if ($taxMaster && strtolower($taxMaster->status) === 'active') {
                        $contract->contractTaxes()->create([
                            'tax_id' => $taxMaster->id,
                            'tax_name' => $taxMaster->tax_name,
                            'tax_type' => $taxMaster->tax_type,
                            'percentage' => $taxMaster->percentage,
                        ]);
                    }
                }
            }
        } else {
            $contract->contractTaxes()->delete();
        }
    }
}
