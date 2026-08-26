<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Driver extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'name',
        'mobile',
        'email',
        'password',
        'license_number',
        'license_expiry',
        'address',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    protected static function booted()
    {
        static::creating(function ($driver) {
            if (empty($driver->id)) {
                $driver->id = (string) Str::uuid();
            }
        });
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function trips()
    {
        return $this->hasMany(Trip::class);
    }
}
