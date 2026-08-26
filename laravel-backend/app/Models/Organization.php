<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Organization extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'name',
        'type',
        'contact_person',
        'email',
        'phone',
        'address',
        'pickup_location',
        'drop_location',
        'billing_address',
        'tax_number',
        'billing_contact_name',
        'billing_contact_email',
        'billing_contact_phone',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($org) {
            if (empty($org->id)) {
                $org->id = (string) Str::uuid();
            }
        });
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
