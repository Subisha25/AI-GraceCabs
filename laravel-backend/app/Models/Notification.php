<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Notification extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'operator_id',
        'booking_id',
        'invoice_id',
        'type',
        'channel',
        'title',
        'message',
        'status',
        'sent_at',
    ];

    protected static function booted()
    {
        static::creating(function ($notif) {
            if (empty($notif->id)) {
                $notif->id = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
