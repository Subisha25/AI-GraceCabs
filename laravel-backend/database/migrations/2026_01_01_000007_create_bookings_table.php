<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operator_id');
            $table->uuid('user_id');
            $table->uuid('organization_id')->nullable();
            $table->uuid('vehicle_id')->nullable();
            $table->uuid('driver_id')->nullable();
            
            $table->string('booking_code')->unique();
            $table->string('booking_type'); // individual, organization
            
            $table->string('pickup_location');
            $table->string('drop_location');
            
            $table->date('booking_date');
            $table->time('booking_time');
            
            $table->string('trip_type'); // one_way, round_trip
            $table->integer('passenger_count')->default(1);
            
            $table->decimal('estimated_distance_km', 8, 2);
            $table->decimal('estimated_fare', 10, 2);
            
            $table->decimal('actual_distance_km', 8, 2)->nullable();
            $table->decimal('final_fare', 10, 2)->nullable();
            
            $table->string('status')->default('pending'); // pending, confirmed, started, completed, cancelled
            $table->text('customer_notes')->nullable();
            
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('driver_assigned_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('operator_id')->references('id')->on('operators')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('set null');
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->foreign('driver_id')->references('id')->on('drivers')->onDelete('set null');

            $table->index('operator_id');
            $table->index('user_id');
            $table->index('organization_id');
            $table->index('booking_code');
            $table->index('booking_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
