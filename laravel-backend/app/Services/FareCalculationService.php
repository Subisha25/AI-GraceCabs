<?php

namespace App\Services;

use App\Models\Vehicle;

class FareCalculationService
{
    /**
     * Calculates estimated fare based on distance and vehicle per-KM tariff.
     */
    public function calculateFare(float $distanceKm, float $pricePerKm): float
    {
        $fare = $distanceKm * $pricePerKm;
        
        return round($fare, 2);
    }

    /**
     * Calculates tax based on the subtotal and the configured tax rate.
     */
    public function calculateTax(float $subtotal): float
    {
        $ratePercent = config('billing.tax_rate', 0);
        $tax = ($subtotal * $ratePercent) / 100;
        
        return round($tax, 2);
    }
}
