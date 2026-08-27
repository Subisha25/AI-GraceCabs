<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operator_id');
            $table->string('tax_name');
            $table->string('tax_type'); // CGST, SGST, IGST, GST, etc.
            $table->decimal('percentage', 5, 2);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('operator_id')->references('id')->on('operators')->onDelete('cascade');
        });

        Schema::create('contract_taxes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contract_id');
            $table->uuid('tax_id');
            $table->string('tax_name');
            $table->string('tax_type');
            $table->decimal('percentage', 5, 2);
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->boolean('allow_tax')->default(true)->after('tax_number');
        });

        Schema::create('contract_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contract_id');
            $table->string('stop_name');
            $table->text('address');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('sequence')->default(1);
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->text('tax_details')->nullable()->after('tax_amount');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('tax_details');
        });

        Schema::dropIfExists('contract_stops');

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('allow_tax');
        });

        Schema::dropIfExists('contract_taxes');
        Schema::dropIfExists('taxes');
    }
};
