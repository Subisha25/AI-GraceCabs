<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tax extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'operator_id',
        'tax_name',
        'tax_type',
        'percentage',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($tax) {
            if (empty($tax->id)) {
                $tax->id = (string) Str::uuid();
            }
        });
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }
}
