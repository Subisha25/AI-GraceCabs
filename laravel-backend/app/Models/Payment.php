<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payment extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'invoice_id',
        'operator_id',
        'amount',
        'payment_method',
        'transaction_id',
        'status',
        'paid_at',
        'notes',
    ];

    protected static function booted()
    {
        static::creating(function ($payment) {
            if (empty($payment->id)) {
                $payment->id = (string) Str::uuid();
            }
        });
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }
}
