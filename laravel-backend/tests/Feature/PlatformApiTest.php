<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Operator;
use App\Models\Organization;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Booking;
use App\Models\Trip;
use App\Models\TripLocation;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Otp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PlatformApiTest extends TestCase
{
    use RefreshDatabase;
    
    protected string $operatorId = 'e111111d-2e65-4d7a-85d1-125035feee1a';

    public function test_customer_lifecycle_and_booking_operations()
    {
        // 1. Ensure Operator exists
        $operator = Operator::firstOrCreate(
            ['id' => $this->operatorId],
            [
                'name' => 'Platform Operator',
                'email' => 'admin-operator@test.local',
                'phone' => '9841722675',
                'address' => 'Surandai, Tamil Nadu',
            ]
        );

        // 2. Test Customer Registration (POST /api/auth/register)
        $mobile = '9888881234';
        $email = 'test-e2e@danfoss.com';
        
        $regResponse = $this->postJson('/api/auth/register', [
            'name' => 'Subisha E2E Customer',
            'email' => $email,
            'mobile' => $mobile,
            'password' => 'customer123',
            'password_confirmation' => 'customer123',
        ]);

        $regResponse->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => $email, 'status' => 'pending']);

        // 3. Test Send OTP (POST /api/auth/send-otp)
        $sendOtpResponse = $this->postJson('/api/auth/send-otp', [
            'mobile' => $mobile,
            'purpose' => 'register',
        ]);
        $sendOtpResponse->assertStatus(200);
        $this->assertDatabaseHas('otps', ['mobile' => $mobile]);

        // Retrieve OTP from testing Cache
        $otpCode = Cache::get('test_otp_' . $mobile);
        $this->assertNotNull($otpCode);

        // 4. Test Verify OTP (POST /api/auth/verify-otp)
        $verifyOtpResponse = $this->postJson('/api/auth/verify-otp', [
            'mobile' => $mobile,
            'otp' => $otpCode,
            'purpose' => 'register',
        ]);

        $verifyOtpResponse->assertStatus(200);
        $verifyOtpResponse->assertJsonStructure(['token', 'user']);
        
        // Assert user activated
        $this->assertDatabaseHas('users', ['email' => $email, 'status' => 'active']);

        // Retrieve activated customer model
        $customer = User::where('email', $email)->first();
        $this->assertNotNull($customer);

        // 5. Create Vehicle
        $vehicle = Vehicle::create([
            'operator_id' => $this->operatorId,
            'vehicle_type' => 'SUV Innova',
            'vehicle_number' => 'TN-72-9999',
            'seating_capacity' => 6,
            'price_per_km' => 20.00,
            'status' => 'available',
        ]);

        // 6. Test Book Cab request (POST /api/bookings)
        $bookingResponse = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/bookings', [
                'pickup_location' => 'Surandai Bus Stand',
                'drop_location' => 'Tenkasi Junction',
                'booking_date' => date('Y-m-d', strtotime('+1 day')),
                'booking_time' => '14:00',
                'vehicle_id' => $vehicle->id,
                'passenger_count' => 2,
                'trip_type' => 'one_way',
            ]);

        $bookingResponse->assertStatus(201);
        $bookingResponse->assertJsonStructure(['data' => ['booking_code', 'estimated_distance_km', 'estimated_fare']]);
        
        $bookingId = $bookingResponse->json('data.id');
        $this->assertEquals('pending', $bookingResponse->json('data.status'));

        // 7. Get Superadmin for dispatch ops
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Platform Admin',
            'email' => 'admin@test.local',
            'mobile' => '9999999991',
            'password' => bcrypt('superadmin123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        // 8. Accept Booking (POST /api/bookings/{id}/accept)
        $acceptResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/bookings/{$bookingId}/accept");
        $acceptResponse->assertStatus(200);
        $this->assertEquals('accepted', $acceptResponse->json('data.status'));

        // Assert invalid transition check: ACCEPTED -> accept (should return 422)
        $invalidAcceptResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/bookings/{$bookingId}/accept");
        $invalidAcceptResponse->assertStatus(422);

        // 9. Assign Driver (POST /api/bookings/{id}/assign-driver)
        $driver = Driver::create([
            'operator_id' => $this->operatorId,
            'name' => 'Murugan E2E',
            'mobile' => '9000012345',
            'license_number' => 'DL-999999',
            'status' => 'active',
        ]);

        $assignResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/bookings/{$bookingId}/assign-driver", [
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
            ]);
        $assignResponse->assertStatus(200);
        $this->assertEquals('confirmed', $assignResponse->json('data.status'));

        // Test Overlapping assignment: create another booking and assign the same busy driver
        $booking2 = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'booking_code' => 'BK-TEST2',
            'booking_type' => 'individual',
            'pickup_location' => 'Point A',
            'drop_location' => 'Point B',
            'booking_date' => date('Y-m-d', strtotime('+1 day')),
            'booking_time' => '15:00',
            'trip_type' => 'one_way',
            'passenger_count' => 2,
            'estimated_distance_km' => 10.0,
            'estimated_fare' => 200.0,
            'status' => 'accepted'
        ]);

        $overlapResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/bookings/{$booking2->id}/assign-driver", [
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
            ]);
        $overlapResponse->assertStatus(422); // Should fail overlapping checks

        // 10. Start Trip as Driver (POST /api/driver/trips/{id}/start)
        $driverUser = User::create([
            'operator_id' => $this->operatorId,
            'name' => $driver->name,
            'email' => 'driver-e2e@test.local',
            'mobile' => $driver->mobile,
            'password' => bcrypt('driver123'),
            'role' => 'driver',
            'status' => 'active',
        ]);

        $startTripResponse = $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/driver/trips/{$bookingId}/start", [
                'latitude' => 8.9754,
                'longitude' => 77.4278,
            ]);
        $startTripResponse->assertStatus(200);
        $this->assertEquals('started', $startTripResponse->json('data.status'));
        $tripId = $startTripResponse->json('data.id');

        // 11. GPS Location Log (POST /api/trips/{id}/locations)
        $gpsResponse = $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/trips/{$tripId}/locations", [
                'latitude' => 8.9800,
                'longitude' => 77.4300,
            ]);
        $gpsResponse->assertStatus(200);

        // Security check: Customer B cannot view Customer A's live tracking
        $customerB = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Customer B',
            'email' => 'customerb@test.local',
            'mobile' => '9555555555',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $unauthTracking = $this->actingAs($customerB, 'sanctum')
            ->getJson("/api/bookings/{$bookingId}/tracking");
        $unauthTracking->assertStatus(403);

        // 12. Complete Trip (POST /api/driver/trips/{id}/complete)
        $completeResponse = $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/driver/trips/{$tripId}/complete", [
                'latitude' => 9.0012,
                'longitude' => 77.4567,
            ]);
        $completeResponse->assertStatus(200);
        $completeResponse->assertJsonStructure(['data' => ['invoice' => ['invoice_number', 'total_amount']]]);
    }

    public function test_booking_rejection_flow()
    {
        // 1. Ensure Operator exists
        $operator = Operator::firstOrCreate(
            ['id' => $this->operatorId],
            [
                'name' => 'Platform Operator',
                'email' => 'admin-operator@test.local',
                'phone' => '9841722675',
                'address' => 'Surandai, Tamil Nadu',
            ]
        );

        // Setup simple booking
        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Subisha E2E Customer',
            'email' => 'customer-reject@danfoss.com',
            'mobile' => '9888881235',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::create([
            'operator_id' => $this->operatorId,
            'vehicle_type' => 'Sedan Dzire',
            'vehicle_number' => 'TN-72-8888',
            'seating_capacity' => 4,
            'price_per_km' => 15.00,
            'status' => 'available',
        ]);

        $booking = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'booking_code' => 'BK-REJ1',
            'booking_type' => 'individual',
            'pickup_location' => 'Pickup Location',
            'drop_location' => 'Drop Location',
            'booking_date' => date('Y-m-d', strtotime('+1 day')),
            'booking_time' => '12:00',
            'trip_type' => 'one_way',
            'passenger_count' => 2,
            'estimated_distance_km' => 15.0,
            'estimated_fare' => 225.0,
            'status' => 'pending',
        ]);

        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Platform Admin',
            'email' => 'admin-reject@test.local',
            'mobile' => '9999999992',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Reject booking (POST /api/bookings/{id}/reject)
        $rejectResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/reject", [
                'reason' => 'No vehicles available at selected slot.'
            ]);

        $rejectResponse->assertStatus(200);
        $this->assertEquals('rejected', $rejectResponse->json('data.status'));
        $this->assertEquals('No vehicles available at selected slot.', $rejectResponse->json('data.rejection_reason'));

        // Assert rejected booking cannot be accepted or assigned a driver
        $assignResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/assign-driver", [
                'driver_id' => Str::uuid(),
                'vehicle_id' => $vehicle->id
            ]);
        $assignResponse->assertStatus(422);
    }
}
