<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => 'required|uuid|exists:organizations,id',
            'contract_name' => 'required|string|max:191',
            'vehicle_id' => 'nullable|uuid|exists:vehicles,id',
            'contract_type' => 'required|string', // legacy support
            'pricing_model' => 'required|string|in:PER_KM,FIXED_MONTHLY',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'pickup_location' => 'required|string|max:191',
            'drop_location' => 'required|string|max:191',
            'working_days' => 'required|integer|min:1',
            'hours_per_day' => 'nullable|numeric|min:0',
            'km_per_day' => 'nullable|numeric|min:0',
            'rate_per_km' => 'required|numeric|min:0',
            'monthly_fixed_amount' => 'nullable|numeric|min:0',
            'billing_cycle' => 'nullable|string',
            'service_days' => 'nullable|string',
            'number_of_vehicles' => 'nullable|integer|min:1',
            'tax_rate_percent' => 'nullable|numeric|min:0',
            'billing_contact' => 'nullable|string|max:191',
            'billing_email' => 'nullable|email|max:191',
            'status' => 'required|string|in:draft,active,expired,cancelled,DRAFT,ACTIVE,EXPIRED,CANCELLED',
            'stops' => 'nullable|array',
            'stops.*.stop_name' => 'required_with:stops|string|max:191',
            'stops.*.address' => 'required_with:stops|string|max:500',
            'stops.*.latitude' => 'nullable|numeric',
            'stops.*.longitude' => 'nullable|numeric',
            'stops.*.sequence' => 'nullable|integer',
            'taxes' => 'nullable|array',
            'taxes.*' => 'uuid|exists:taxes,id',
        ];
    }
}
