<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mobile' => 'required|string|max:20',
            'otp' => 'required|string|size:6',
            'purpose' => 'required|string|in:login,register',
        ];
    }
}
