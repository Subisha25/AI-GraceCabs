<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TripLocation extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'trip_id',
        'latitude',
        'longitude',
        'recorded_at',
    ];

    protected static function booted()
    {
        static::creating(function ($loc) {
            if (empty($loc->id)) {
                $loc->id = (string) Str::uuid();
            }
            if (empty($loc->recorded_at)) {
                $loc->recorded_at = now();
            }
        });
    }

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
