<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Invoice extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'booking_id',
        'organization_id',
        'contract_id',
        'invoice_number',
        'invoice_type',
        'subtotal',
        'tax_amount',
        'total_amount',
        'status',
        'issued_at',
        'due_at',
        'paid_at',
        'pdf_path',
        'billing_period',
        'total_trips',
        'total_km',
        'total_hours',
        'base_amount',
        'extra_km',
        'extra_hours',
        'rate_applied',
        'generated_at',
    ];

    protected static function booted()
    {
        static::creating(function ($invoice) {
            if (empty($invoice->id)) {
                $invoice->id = (string) Str::uuid();
            }
        });
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
