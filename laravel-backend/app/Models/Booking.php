<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'user_id',
        'customer_name',
        'customer_mobile',
        'organization_id',
        'contract_id',
        'vehicle_id',
        'driver_id',
        'booking_code',
        'booking_type',
        'pickup_location',
        'drop_location',
        'booking_date',
        'booking_time',
        'expected_end_date',
        'expected_end_time',
        'trip_type',
        'passenger_count',
        'estimated_distance_km',
        'estimated_fare',
        'actual_distance_km',
        'final_fare',
        'status',
        'rejection_reason',
        'customer_notes',
        'accepted_at',
        'driver_assigned_at',
        'started_at',
        'completed_at',
    ];

    protected static function booted()
    {
        static::creating(function ($booking) {
            if (empty($booking->id)) {
                $booking->id = (string) Str::uuid();
            }
        });
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function passengers()
    {
        return $this->hasMany(BookingPassenger::class);
    }

    public function trip()
    {
        return $this->hasOne(Trip::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public static function concatDateTimeSql($dateField, $timeField)
    {
        $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            return "({$dateField} || ' ' || {$timeField})";
        }
        return "CONCAT({$dateField}, ' ', {$timeField})";
    }
}
