<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add vehicle_type_id column as nullable temporarily to allow migration of data
        Schema::table('vehicles', function (Blueprint $table) {
            $table->uuid('vehicle_type_id')->nullable()->after('operator_id');
        });

        // 2. Migrate existing data
        $vehicles = DB::table('vehicles')->get();
        $typeCache = [];

        foreach ($vehicles as $vehicle) {
            $key = $vehicle->vehicle_name . '_' . $vehicle->seating_capacity . '_' . $vehicle->price_per_km;

            if (!isset($typeCache[$key])) {
                $typeId = (string) Str::uuid();
                DB::table('vehicle_types')->insert([
                    'id' => $typeId,
                    'name' => $vehicle->vehicle_name,
                    'seating_capacity' => $vehicle->seating_capacity,
                    'price_per_km' => $vehicle->price_per_km,
                    'image' => $vehicle->image,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $typeCache[$key] = $typeId;
            }

            // Update physical vehicle record to point to the type
            DB::table('vehicles')->where('id', $vehicle->id)->update([
                'vehicle_type_id' => $typeCache[$key]
            ]);
        }

        // 3. Make vehicle_type_id foreign key and non-nullable
        Schema::table('vehicles', function (Blueprint $table) {
            $table->uuid('vehicle_type_id')->nullable(false)->change();
            $table->foreign('vehicle_type_id')->references('id')->on('vehicle_types')->onDelete('cascade');
        });

        // 4. Drop redundant columns
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['vehicle_name', 'seating_capacity', 'price_per_km', 'image']);
        });
    }

    public function down(): void
    {
        // Re-add dropped columns
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('vehicle_name')->nullable();
            $table->integer('seating_capacity')->nullable();
            $table->decimal('price_per_km', 10, 2)->nullable();
            $table->string('image')->nullable();
        });

        // Restore data from vehicle_types to vehicles
        $vehicles = DB::table('vehicles')->get();
        foreach ($vehicles as $vehicle) {
            if ($vehicle->vehicle_type_id) {
                $type = DB::table('vehicle_types')->where('id', $vehicle->vehicle_type_id)->first();
                if ($type) {
                    DB::table('vehicles')->where('id', $vehicle->id)->update([
                        'vehicle_name' => $type->name,
                        'seating_capacity' => $type->seating_capacity,
                        'price_per_km' => $type->price_per_km,
                        'image' => $type->image,
                    ]);
                }
            }
        }

        // Drop foreign key and column
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropForeign(['vehicle_type_id']);
            $table->dropColumn('vehicle_type_id');
        });
    }
};
