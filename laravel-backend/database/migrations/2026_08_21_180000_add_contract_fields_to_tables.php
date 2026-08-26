<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add pickup/drop locations to organizations
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('pickup_location')->nullable()->after('address');
            $table->string('drop_location')->nullable()->after('pickup_location');
        });

        // Add detailed recurring settings to contracts
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('contract_name')->after('organization_id');
            $table->string('pricing_model')->after('contract_type')->default('PER_KM'); // PER_KM, FIXED_MONTHLY
            $table->string('billing_cycle')->after('pricing_model')->default('monthly');
            $table->string('service_days')->after('billing_cycle')->nullable(); // e.g. "Mon,Tue,Wed,Thu,Fri"
            $table->integer('number_of_vehicles')->after('service_days')->default(1);
            $table->decimal('tax_rate_percent', 5, 2)->after('number_of_vehicles')->default(0.00);
            $table->string('billing_contact')->after('tax_rate_percent')->nullable();
            $table->string('billing_email')->after('billing_contact')->nullable();
            
            // In contracts, vehicle_id was created as NOT NULL. We make it nullable so that it is optional.
            $table->uuid('vehicle_id')->nullable()->change();
        });

        // Link bookings to contracts
        Schema::table('bookings', function (Blueprint $table) {
            $table->uuid('contract_id')->nullable()->after('organization_id');
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('set null');
        });

        // Link invoices to contracts & append calculation audit trails
        Schema::table('invoices', function (Blueprint $table) {
            $table->uuid('contract_id')->nullable()->after('organization_id');
            $table->string('billing_period', 7)->nullable()->after('contract_id'); // e.g. "2026-08"
            $table->integer('total_trips')->default(0)->after('billing_period');
            $table->decimal('total_km', 10, 2)->default(0.00)->after('total_trips');
            $table->decimal('total_hours', 8, 2)->default(0.00)->after('total_km');
            $table->decimal('base_amount', 12, 2)->default(0.00)->after('total_hours');
            $table->decimal('extra_km', 10, 2)->default(0.00)->after('base_amount');
            $table->decimal('extra_hours', 8, 2)->default(0.00)->after('extra_km');
            $table->decimal('rate_applied', 10, 2)->default(0.00)->after('extra_hours');
            $table->timestamp('generated_at')->nullable()->after('pdf_path');

            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn([
                'contract_id', 'billing_period', 'total_trips', 'total_km', 
                'total_hours', 'base_amount', 'extra_km', 'extra_hours', 
                'rate_applied', 'generated_at'
            ]);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn(['contract_id']);
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn([
                'contract_name', 'pricing_model', 'billing_cycle', 'service_days', 
                'number_of_vehicles', 'tax_rate_percent', 'billing_contact', 'billing_email'
            ]);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['pickup_location', 'drop_location']);
        });
    }
};
