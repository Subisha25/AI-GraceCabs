<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrganizationRequest;
use App\Models\Organization;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $operatorId = $request->user()->operator_id;
        $orgs = Organization::where('operator_id', $operatorId)->with('contracts')->get();

        return response()->json([
            'success' => true,
            'data' => $orgs
        ]);
    }

    public function store(OrganizationRequest $request)
    {
        $operatorId = $request->user()->operator_id;

        $org = Organization::create(array_merge(
            $request->validated(),
            ['operator_id' => $operatorId]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Organization created successfully.',
            'data' => $org
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $org = Organization::where('operator_id', $operatorId)
            ->where('id', $id)
            ->with([
                'contracts.vehicle',
                'bookings.vehicle',
                'bookings.driver',
                'invoices.payments',
                'invoices.contract'
            ])
            ->first();

        if (!$org) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $org
        ]);
    }

    public function update(OrganizationRequest $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $org = Organization::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$org) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found.'
            ], 404);
        }

        $org->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Organization updated successfully.',
            'data' => $org
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $org = Organization::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$org) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found.'
            ], 404);
        }

        $org->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organization removed successfully.'
        ]);
    }
}
