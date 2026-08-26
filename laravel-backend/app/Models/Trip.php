<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Trip extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'booking_id',
        'driver_id',
        'vehicle_id',
        'started_at',
        'completed_at',
        'start_latitude',
        'start_longitude',
        'end_latitude',
        'end_longitude',
        'estimated_distance_km',
        'actual_distance_km',
        'duration_seconds',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($trip) {
            if (empty($trip->id)) {
                $trip->id = (string) Str::uuid();
            }
        });
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function locations()
    {
        return $this->hasMany(TripLocation::class);
    }
}
