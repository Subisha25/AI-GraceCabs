<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Otp extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'mobile',
        'otp',
        'purpose',
        'expires_at',
        'verified_at',
    ];

    protected static function booted()
    {
        static::creating(function ($otpModel) {
            if (empty($otpModel->id)) {
                $otpModel->id = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
