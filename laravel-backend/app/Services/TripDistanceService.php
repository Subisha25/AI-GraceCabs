<?php

namespace App\Services;

use App\Models\TripLocation;
use Illuminate\Support\Collection;

class TripDistanceService
{
    /**
     * Calculates actual distance from a collection of trip locations.
     * Returns -1.0 if there are insufficient GPS points (less than 2).
     */
    public function calculateDistance(Collection $locations): float
    {
        if ($locations->count() < 2) {
            return -1.0;
        }

        $totalDistance = 0.0;
        $sorted = $locations->sortBy('recorded_at')->values();

        for ($i = 0; $i < $sorted->count() - 1; $i++) {
            $loc1 = $sorted[$i];
            $loc2 = $sorted[$i + 1];
            $totalDistance += $this->haversine(
                (float) $loc1->latitude,
                (float) $loc1->longitude,
                (float) $loc2->latitude,
                (float) $loc2->longitude
            );
        }

        return round($totalDistance, 2);
    }

    private function haversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}
