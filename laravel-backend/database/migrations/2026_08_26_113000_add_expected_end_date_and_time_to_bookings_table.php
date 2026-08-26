<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'expected_end_date')) {
                $table->date('expected_end_date')->nullable()->after('booking_date');
            }
            if (!Schema::hasColumn('bookings', 'expected_end_time')) {
                $table->time('expected_end_time')->nullable()->after('booking_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['expected_end_date', 'expected_end_time']);
        });
    }
};
