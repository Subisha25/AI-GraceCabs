<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'driver_id' => 'required|uuid|exists:drivers,id',
            'vehicle_id' => 'nullable|uuid|exists:vehicles,id',
        ];
    }
}
