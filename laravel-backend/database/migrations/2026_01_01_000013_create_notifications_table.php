<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->uuid('operator_id');
            
            $table->uuid('booking_id')->nullable();
            $table->uuid('invoice_id')->nullable();
            
            $table->string('type');
            $table->string('channel'); // email, sms, whatsapp, push
            $table->string('title');
            $table->text('message');
            
            $table->string('status')->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('operator_id')->references('id')->on('operators')->onDelete('cascade');
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('set null');
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');

            $table->index('user_id');
            $table->index('operator_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
