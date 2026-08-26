<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:191',
            'email' => 'nullable|email|unique:users,email',
            'mobile' => 'required|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ];
    }
}
