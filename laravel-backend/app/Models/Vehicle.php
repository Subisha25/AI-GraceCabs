<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Vehicle extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'vehicle_type',
        'vehicle_number',
        'seating_capacity',
        'price_per_km',
        'image',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($vehicle) {
            if (empty($vehicle->id)) {
                $vehicle->id = (string) Str::uuid();
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

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
