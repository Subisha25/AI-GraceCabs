<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Contract extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'organization_id',
        'contract_name',
        'vehicle_id',
        'contract_type',
        'pricing_model',
        'start_date',
        'end_date',
        'pickup_location',
        'drop_location',
        'working_days',
        'hours_per_day',
        'km_per_day',
        'rate_per_km',
        'monthly_fixed_amount',
        'billing_cycle',
        'service_days',
        'number_of_vehicles',
        'tax_rate_percent',
        'billing_contact',
        'billing_email',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($contract) {
            if (empty($contract->id)) {
                $contract->id = (string) Str::uuid();
            }
        });
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
