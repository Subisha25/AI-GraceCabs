<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:191',
            'mobile' => 'required|string|max:20',
            'email' => 'nullable|email|max:191',
            'password' => 'nullable|string|min:6',
            'license_number' => 'required|string|max:50',
            'license_expiry' => 'nullable|date',
            'address' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ];
    }
}
