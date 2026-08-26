<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Operator;
use App\Models\Organization;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\Trip;
use App\Models\TripLocation;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Operator
        $operatorId = 'e111111d-2e65-4d7a-85d1-125035feee1a';
        $operator = Operator::updateOrCreate(
            ['id' => $operatorId],
            [
                'name' => 'Platform Operator',
                'email' => 'admin-operator@test.local',
                'phone' => '9841722675',
                'address' => 'Surandai, Tamil Nadu',
                'status' => 'active',
            ]
        );
        echo "✓ Operator verified\n";

        // 2. Create Organization
        $org = Organization::updateOrCreate(
            ['email' => 'hr@danfoss.com'],
            [
                'operator_id' => $operatorId,
                'name' => 'Danfoss India',
                'type' => 'company',
                'contact_person' => 'Manager HR',
                'phone' => '04439226000',
                'address' => 'Chennai, Tamil Nadu',
                'billing_address' => 'Chennai HQ Office',
                'tax_number' => '33AAACD1234F1Z0',
                'billing_contact_name' => 'Accounts Danfoss',
                'billing_contact_email' => 'billing@danfoss.com',
                'billing_contact_phone' => '04439226001',
                'status' => 'active',
            ]
        );
        echo "✓ Organization verified\n";

        // 3. Create Users
        // Admin
        $superadmin = User::updateOrCreate(
            ['email' => 'superadmin@gracecabs.com'],
            [
                'operator_id' => $operatorId,
                'name' => 'Grace Superadmin',
                'mobile' => '9999999991',
                'password' => bcrypt('superadmin123'),
                'role' => 'superadmin',
                'status' => 'active',
            ]
        );

        // Manager
        $manager = User::updateOrCreate(
            ['email' => 'hr@danfoss.com'],
            [
                'operator_id' => $operatorId,
                'organization_id' => $org->id,
                'name' => 'Danfoss Manager',
                'mobile' => '9999999994',
                'password' => bcrypt('manager123'),
                'role' => 'manager',
                'status' => 'active',
            ]
        );

        // Customer 1
        $customer1 = User::updateOrCreate(
            ['email' => 'subisha@danfoss.com'],
            [
                'operator_id' => $operatorId,
                'organization_id' => $org->id,
                'name' => 'Subisha Customer',
                'mobile' => '9999999992',
                'password' => bcrypt('customer123'),
                'role' => 'customer',
                'status' => 'active',
            ]
        );

        // Customer 2
        $customer2 = User::updateOrCreate(
            ['email' => 'rajesh@test.local'],
            [
                'operator_id' => $operatorId,
                'name' => 'Rajesh Customer',
                'mobile' => '9999999993',
                'password' => bcrypt('customer123'),
                'role' => 'customer',
                'status' => 'active',
            ]
        );
        echo "✓ Users (Admin, Manager, 2 Customers) verified\n";

        // 4. Create 2 Vehicles
        $vehicle1 = Vehicle::updateOrCreate(
            ['vehicle_number' => 'TN-72-AX-1234'],
            [
                'operator_id' => $operatorId,
                'vehicle_type' => 'Toyota Innova Crysta',
                'seating_capacity' => 7,
                'price_per_km' => 22.00,
                'status' => 'available',
            ]
        );

        $vehicle2 = Vehicle::updateOrCreate(
            ['vehicle_number' => 'TN-72-BX-5678'],
            [
                'operator_id' => $operatorId,
                'vehicle_type' => 'Suzuki Dzire',
                'seating_capacity' => 4,
                'price_per_km' => 15.00,
                'status' => 'available',
            ]
        );
        echo "✓ 2 Vehicles verified\n";

        // 5. Create 2 Drivers
        $driver1 = Driver::updateOrCreate(
            ['mobile' => '9876543210'],
            [
                'operator_id' => $operatorId,
                'name' => 'Driver Murugan',
                'email' => 'murugan@test.local',
                'password' => bcrypt('driver123'),
                'license_number' => 'DL-7220261234',
                'status' => 'active',
            ]
        );

        $driver2 = Driver::updateOrCreate(
            ['mobile' => '9876543211'],
            [
                'operator_id' => $operatorId,
                'name' => 'Driver Selvam',
                'email' => 'selvam@test.local',
                'password' => bcrypt('driver123'),
                'license_number' => 'DL-7220261235',
                'status' => 'active',
            ]
        );
        echo "✓ 2 Drivers verified\n";

        // 6. Create 2 Bookings
        // Booking 1: PENDING
        $booking1 = Booking::updateOrCreate(
            ['booking_code' => 'BK-PEND01'],
            [
                'operator_id' => $operatorId,
                'user_id' => $customer1->id,
                'organization_id' => $org->id,
                'vehicle_id' => $vehicle2->id,
                'booking_type' => 'organization',
                'pickup_location' => 'Surandai Bus Stand',
                'drop_location' => 'Tenkasi Junction',
                'booking_date' => date('Y-m-d'),
                'booking_time' => '10:00:00',
                'trip_type' => 'one_way',
                'passenger_count' => 2,
                'estimated_distance_km' => 25.00,
                'estimated_fare' => 375.00,
                'status' => 'pending',
            ]
        );

        // Booking 2: ACCEPTED
        $booking2 = Booking::updateOrCreate(
            ['booking_code' => 'BK-ACCP02'],
            [
                'operator_id' => $operatorId,
                'user_id' => $customer2->id,
                'vehicle_id' => $vehicle1->id,
                'booking_type' => 'individual',
                'pickup_location' => 'Tenkasi Bus Stand',
                'drop_location' => 'Tirunelveli Junction',
                'booking_date' => date('Y-m-d'),
                'booking_time' => '14:00:00',
                'trip_type' => 'one_way',
                'passenger_count' => 4,
                'estimated_distance_km' => 55.00,
                'estimated_fare' => 1210.00,
                'status' => 'accepted',
            ]
        );
        echo "✓ 2 Bookings verified\n";
    }
}
