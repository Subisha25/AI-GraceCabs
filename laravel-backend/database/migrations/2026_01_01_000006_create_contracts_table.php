<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operator_id');
            $table->uuid('organization_id');
            $table->uuid('vehicle_id');
            
            $table->string('contract_type'); // monthly_fixed, km_based, hybrid
            $table->date('start_date');
            $table->date('end_date');
            
            $table->string('pickup_location');
            $table->string('drop_location');
            
            $table->integer('working_days');
            $table->decimal('hours_per_day', 6, 2)->nullable();
            $table->decimal('km_per_day', 8, 2)->nullable();
            
            $table->decimal('rate_per_km', 10, 2);
            $table->decimal('monthly_fixed_amount', 12, 2)->nullable();
            
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('operator_id')->references('id')->on('operators')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');

            $table->index('operator_id');
            $table->index('organization_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
