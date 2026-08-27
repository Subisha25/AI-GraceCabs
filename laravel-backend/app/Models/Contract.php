<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Contract extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $appends = ['actual_service_days'];

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

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function stops()
    {
        return $this->hasMany(ContractStop::class)->orderBy('sequence', 'asc');
    }

    public function contractTaxes()
    {
        return $this->hasMany(ContractTax::class);
    }

    public function getActualServiceDaysAttribute()
    {
        return self::calculateServiceDaysCount($this->start_date, $this->end_date, $this->service_days);
    }

    public static function calculateServiceDaysCount($startDate, $endDate, $serviceDaysStr)
    {
        if (!$startDate || !$endDate || !$serviceDaysStr) {
            return 0;
        }

        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);

        if ($start->gt($end)) {
            return 0;
        }

        $dayMap = [
            'monday'    => 1, 'mon' => 1,
            'tuesday'   => 2, 'tue' => 2,
            'wednesday' => 3, 'wed' => 3,
            'thursday'  => 4, 'thu' => 4,
            'friday'    => 5, 'fri' => 5,
            'saturday'  => 6, 'sat' => 6,
            'sunday'    => 7, 'sun' => 7,
        ];

        $allowedDays = [];
        $serviceDaysStr = strtolower(trim($serviceDaysStr));

        if (str_contains($serviceDaysStr, '-')) {
            $parts = explode('-', $serviceDaysStr);
            if (count($parts) === 2) {
                $startDayNum = $dayMap[trim($parts[0])] ?? null;
                $endDayNum = $dayMap[trim($parts[1])] ?? null;

                if ($startDayNum !== null && $endDayNum !== null) {
                    if ($startDayNum <= $endDayNum) {
                        for ($d = $startDayNum; $d <= $endDayNum; $d++) {
                            $allowedDays[] = $d;
                        }
                    } else {
                        for ($d = $startDayNum; $d <= 7; $d++) {
                            $allowedDays[] = $d;
                        }
                        for ($d = 1; $d <= $endDayNum; $d++) {
                            $allowedDays[] = $d;
                        }
                    }
                }
            }
        } else {
            $normalized = str_replace([' ', ';'], ',', $serviceDaysStr);
            $parts = explode(',', $normalized);
            foreach ($parts as $p) {
                $p = trim($p);
                if (isset($dayMap[$p])) {
                    $allowedDays[] = $dayMap[$p];
                }
            }
        }

        $allowedDays = array_unique($allowedDays);
        if (empty($allowedDays)) {
            $allowedDays = [1, 2, 3, 4, 5];
        }

        $count = 0;
        $current = $start->copy();
        while ($current->lte($end)) {
            $isoDay = $current->dayOfWeek === 0 ? 7 : $current->dayOfWeek;
            if (in_array($isoDay, $allowedDays)) {
                $count++;
            }
            $current->addDay();
        }

        return $count;
    }
}
