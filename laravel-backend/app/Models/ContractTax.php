<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ContractTax extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'contract_id',
        'tax_id',
        'tax_name',
        'tax_type',
        'percentage',
    ];

    protected static function booted()
    {
        static::creating(function ($pivot) {
            if (empty($pivot->id)) {
                $pivot->id = (string) Str::uuid();
            }
        });
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function tax()
    {
        return $this->belongsTo(Tax::class);
    }
}
