<?php

namespace App\Services;

class DistanceService
{
    /**
     * Calculates the estimated distance in kilometers between pickup and drop points.
     */
    public function calculateDistance(string $pickup, string $drop): float
    {
        // Deterministic mock distance using CRC32 to ensure E2E tests are stable
        $pHash = crc32(strtolower(trim($pickup)));
        $dHash = crc32(strtolower(trim($drop)));
        
        $distance = abs($pHash - $dHash) % 45 + 5.5; // Always between 5.5 and 50.5 km
        
        return round($distance, 2);
    }
}
