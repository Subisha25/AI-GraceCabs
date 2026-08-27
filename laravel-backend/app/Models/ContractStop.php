<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ContractStop extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'contract_id',
        'stop_name',
        'address',
        'latitude',
        'longitude',
        'sequence',
    ];

    protected static function booted()
    {
        static::creating(function ($stop) {
            if (empty($stop->id)) {
                $stop->id = (string) Str::uuid();
            }
        });
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
