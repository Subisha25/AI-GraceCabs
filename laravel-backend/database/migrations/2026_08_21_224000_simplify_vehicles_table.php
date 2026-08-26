<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop foreign key and column from bookings
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'vehicle_type_id')) {
                try {
                    $table->dropForeign(['vehicle_type_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('vehicle_type_id');
            }
        });

        // 2. Drop foreign key and columns from vehicles
        Schema::table('vehicles', function (Blueprint $table) {
            if (Schema::hasColumn('vehicles', 'vehicle_type_id')) {
                try {
                    $table->dropForeign(['vehicle_type_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('vehicle_type_id');
            }
            
            if (!Schema::hasColumn('vehicles', 'vehicle_type')) {
                $table->string('vehicle_type')->nullable()->after('operator_id');
            }
            if (!Schema::hasColumn('vehicles', 'seating_capacity')) {
                $table->integer('seating_capacity')->default(4)->after('vehicle_number');
            }
            if (!Schema::hasColumn('vehicles', 'price_per_km')) {
                $table->decimal('price_per_km', 10, 2)->default(0.00)->after('seating_capacity');
            }
            if (!Schema::hasColumn('vehicles', 'image')) {
                $table->string('image')->nullable()->after('price_per_km');
            }
        });

        // 3. Drop vehicle_types table
        Schema::dropIfExists('vehicle_types');
    }

    public function down(): void
    {
        // Revert is not required as this is a strict simplification phase
    }
};
