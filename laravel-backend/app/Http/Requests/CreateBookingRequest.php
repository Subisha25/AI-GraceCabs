<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'pickup_location' => 'required|string|max:191',
            'drop_location' => 'required|string|max:191',
            'booking_date' => 'required|date',
            'booking_time' => 'required|string',
            'expected_end_date' => 'nullable|date',
            'expected_end_time' => 'nullable|string',
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'passenger_count' => 'required|integer|min:1',
            'trip_type' => 'required|string|in:one_way,round_trip',
            'customer_notes' => 'nullable|string',
            'contract_id' => 'nullable|uuid|exists:contracts,id',
            'organization_id' => 'nullable|uuid|exists:organizations,id',
        ];

        $user = auth('sanctum')->user();
        if (!$user || in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            $rules['customer_name'] = 'required|string|max:191';
            $rules['customer_mobile'] = 'required|string|max:20';
        }

        return $rules;
    }
}
