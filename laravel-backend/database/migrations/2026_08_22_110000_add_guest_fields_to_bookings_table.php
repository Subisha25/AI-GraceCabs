<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            try {
                $table->dropForeign(['user_id']);
            } catch (\Exception $e) {}
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
            
            try {
                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            } catch (\Exception $e) {}

            if (!Schema::hasColumn('bookings', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('bookings', 'customer_mobile')) {
                $table->string('customer_mobile')->nullable()->after('customer_name');
            }
        });
    }

    public function down(): void
    {
        // Revert not required as this is a strict upgrade
    }
};
