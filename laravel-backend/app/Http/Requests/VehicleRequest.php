<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_name' => 'required|string|max:191',
            'vehicle_number' => 'required|string|max:20',
            'seating_capacity' => 'required|integer|min:1',
            'image' => 'nullable|string|max:255',
            'price_per_km' => 'required|numeric|min:0',
            'status' => 'required|string|in:available,busy,maintenance',
        ];
    }
}
