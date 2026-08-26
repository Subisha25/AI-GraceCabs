<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BookingPassenger extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'booking_id',
        'name',
        'mobile',
        'email',
    ];

    protected static function booted()
    {
        static::creating(function ($bp) {
            if (empty($bp->id)) {
                $bp->id = (string) Str::uuid();
            }
        });
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
