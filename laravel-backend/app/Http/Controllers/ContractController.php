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
                ->with(['organization', 'vehicle'])
                ->get();
        } else {
            $contracts = Contract::where('operator_id', $user->operator_id)
                ->with(['organization', 'vehicle'])
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

        return response()->json([
            'success' => true,
            'message' => 'Contract registered successfully.',
            'data' => $contract
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

        $contract = $query->where('id', $id)->with(['organization', 'vehicle'])->first();

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

        return response()->json([
            'success' => true,
            'message' => 'Contract updated successfully.',
            'data' => $contract
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
}
