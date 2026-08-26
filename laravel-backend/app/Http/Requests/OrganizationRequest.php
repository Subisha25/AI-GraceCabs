<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:191',
            'type' => 'required|string|in:company,school,college,hospital,institution,other',
            'contact_person' => 'required|string|max:191',
            'email' => 'required|email|max:191',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'pickup_location' => 'nullable|string|max:191',
            'drop_location' => 'nullable|string|max:191',
            'billing_address' => 'required|string',
            'tax_number' => 'nullable|string|max:50',
            'billing_contact_name' => 'required|string|max:191',
            'billing_contact_email' => 'required|email|max:191',
            'billing_contact_phone' => 'required|string|max:20',
            'status' => 'required|string|in:active,inactive,ACTIVE,INACTIVE',
        ];
    }
}
