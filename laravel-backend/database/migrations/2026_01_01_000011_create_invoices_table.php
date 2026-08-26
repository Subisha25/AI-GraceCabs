<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operator_id');
            $table->uuid('booking_id')->nullable();
            $table->uuid('organization_id')->nullable();
            
            $table->string('invoice_number');
            $table->string('invoice_type'); // individual, contract_monthly
            
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax_amount', 10, 2);
            $table->decimal('total_amount', 12, 2);
            
            $table->string('status')->default('draft'); // draft, issued, payment_pending, paid, cancelled
            
            $table->timestamp('issued_at');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            
            $table->string('pdf_path')->nullable();
            $table->timestamps();

            $table->foreign('operator_id')->references('id')->on('operators')->onDelete('cascade');
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('set null');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('set null');

            $table->index('operator_id');
            $table->index('booking_id');
            $table->index('organization_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
