<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use Illuminate\Http\Request;

class TaxController extends Controller
{
    public function index(Request $request)
    {
        $operatorId = $request->user()->operator_id;
        $taxes = Tax::where('operator_id', $operatorId)->get();

        return response()->json([
            'success' => true,
            'data' => $taxes
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'tax_name' => 'required|string|max:191',
            'tax_type' => 'required|string|max:50',
            'percentage' => 'required|numeric|min:0|max:100',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $operatorId = $user->operator_id;

        $tax = Tax::create([
            'operator_id' => $operatorId,
            'tax_name' => $request->tax_name,
            'tax_type' => $request->tax_type,
            'percentage' => $request->percentage,
            'status' => $request->status ?: 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tax record created successfully.',
            'data' => $tax
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $operatorId = $request->user()->operator_id;
        $tax = Tax::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$tax) {
            return response()->json([
                'success' => false,
                'message' => 'Tax record not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $tax
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'tax_name' => 'required|string|max:191',
            'tax_type' => 'required|string|max:50',
            'percentage' => 'required|numeric|min:0|max:100',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $operatorId = $user->operator_id;
        $tax = Tax::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$tax) {
            return response()->json([
                'success' => false,
                'message' => 'Tax record not found.'
            ], 404);
        }

        $tax->update([
            'tax_name' => $request->tax_name,
            'tax_type' => $request->tax_type,
            'percentage' => $request->percentage,
            'status' => $request->status ?: 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tax record updated successfully.',
            'data' => $tax
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $tax = Tax::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$tax) {
            return response()->json([
                'success' => false,
                'message' => 'Tax record not found.'
            ], 404);
        }

        $tax->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax record deleted successfully.'
        ]);
    }
}
