<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Operator;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Booking;
use App\Models\Trip;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\TemplateMail;

class InvoicePaymentTest extends TestCase
{
    use RefreshDatabase;

    protected string $operatorId = 'e111111d-2e65-4d7a-85d1-125035feee1a';

    protected function setUp(): void
    {
        parent::setUp();

        // Create Default Operator
        Operator::firstOrCreate(
            ['id' => $this->operatorId],
            [
                'name' => 'Platform Operator',
                'email' => 'admin-operator@test.local',
                'phone' => '9841722675',
                'address' => 'Surandai, Tamil Nadu',
            ]
        );
    }

    public function test_invoice_auto_generation_and_uniqueness()
    {
        Mail::fake();

        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Subisha Customer',
            'email' => 'subisha@test.local',
            'mobile' => '9999999992',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::create([
            'operator_id' => $this->operatorId,
            'vehicle_type' => 'Toyota Innova',
            'vehicle_number' => 'TN-72-AX-1234',
            'seating_capacity' => 7,
            'price_per_km' => 20.00,
            'status' => 'available',
        ]);

        $driver = Driver::create([
            'operator_id' => $this->operatorId,
            'name' => 'Driver Murugan',
            'mobile' => '9876543210',
            'email' => 'murugan@test.local',
            'password' => bcrypt('driver123'),
            'license_number' => 'DL-7220261234',
            'status' => 'active',
        ]);

        $booking = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'booking_code' => 'BK-AUTO1',
            'booking_type' => 'individual',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'booking_date' => date('Y-m-d'),
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'passenger_count' => 3,
            'estimated_distance_km' => 25.00,
            'estimated_fare' => 500.00,
            'status' => 'started',
        ]);

        $trip = Trip::create([
            'booking_id' => $booking->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'status' => 'started',
        ]);

        // Complete trip as driver
        $driverUser = User::create([
            'operator_id' => $this->operatorId,
            'name' => $driver->name,
            'email' => 'driver-e2e@test.local',
            'mobile' => $driver->mobile,
            'password' => bcrypt('driver123'),
            'role' => 'driver',
            'status' => 'active',
        ]);

        $response = $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/driver/trips/{$booking->id}/complete", [
                'latitude' => 9.0000,
                'longitude' => 77.0000,
            ]);

        $response->assertStatus(200);

        // Verify Invoice Automatically Created
        $this->assertDatabaseHas('invoices', [
            'booking_id' => $booking->id,
            'status' => 'payment_pending',
        ]);

        Mail::assertSent(TemplateMail::class);

        $invoice = Invoice::where('booking_id', $booking->id)->first();
        $this->assertNotNull($invoice);
        
        // Assert invoice format: INV-YYYY-000001
        $year = date('Y');
        $this->assertMatchesRegularExpression("/^INV-{$year}-\d{6}$/", $invoice->invoice_number);

        // Verify database index uniqueness: attempting to insert same invoice number should fail
        $this->expectException(\Illuminate\Database\QueryException::class);
        Invoice::create([
            'operator_id' => $this->operatorId,
            'booking_id' => $booking->id,
            'invoice_number' => $invoice->invoice_number,
            'invoice_type' => 'individual',
            'subtotal' => 500.00,
            'tax_amount' => 90.00,
            'total_amount' => 590.00,
            'status' => 'draft',
            'issued_at' => now(),
        ]);
    }

    public function test_cross_customer_invoice_protection()
    {
        $customerA = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Customer A',
            'email' => 'customera@test.local',
            'mobile' => '9999999911',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $customerB = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Customer B',
            'email' => 'customerb@test.local',
            'mobile' => '9999999922',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $invoiceA = Invoice::create([
            'operator_id' => $this->operatorId,
            'invoice_number' => 'INV-2026-999991',
            'invoice_type' => 'individual',
            'subtotal' => 500.00,
            'tax_amount' => 90.00,
            'total_amount' => 590.00,
            'status' => 'payment_pending',
            'issued_at' => now(),
        ]);
        
        $booking = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customerA->id,
            'booking_code' => 'BK-TESTA',
            'booking_type' => 'individual',
            'pickup_location' => 'A',
            'drop_location' => 'B',
            'booking_date' => date('Y-m-d'),
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'passenger_count' => 2,
            'estimated_distance_km' => 10.0,
            'estimated_fare' => 200.0,
            'status' => 'completed',
        ]);

        $invoiceA->update(['booking_id' => $booking->id]);

        // Customer B tries to view Customer A's invoice details (GET /api/invoices/{id})
        $response = $this->actingAs($customerB, 'sanctum')
            ->getJson("/api/invoices/{$invoiceA->id}");

        $response->assertStatus(404); // Should return 404
    }

    public function test_cash_payment_flow()
    {
        Mail::fake();

        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Subisha Customer',
            'email' => 'subisha2@test.local',
            'mobile' => '9999999933',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $invoice = Invoice::create([
            'operator_id' => $this->operatorId,
            'invoice_number' => 'INV-2026-999992',
            'invoice_type' => 'individual',
            'subtotal' => 100.00,
            'tax_amount' => 18.00,
            'total_amount' => 118.00,
            'status' => 'payment_pending',
            'issued_at' => now(),
        ]);

        $booking = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'booking_code' => 'BK-TESTB',
            'booking_type' => 'individual',
            'pickup_location' => 'A',
            'drop_location' => 'B',
            'booking_date' => date('Y-m-d'),
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'passenger_count' => 2,
            'estimated_distance_km' => 10.0,
            'estimated_fare' => 118.0,
            'status' => 'completed',
        ]);
        $invoice->update(['booking_id' => $booking->id]);

        // 1. Customer initiates cash payment (POST /api/invoices/{id}/pay/cash)
        $payCashResponse = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/invoices/{$invoice->id}/pay/cash");

        $payCashResponse->assertStatus(200);
        $this->assertEquals('pending', $payCashResponse->json('data.status'));
        $paymentId = $payCashResponse->json('data.id');

        // Invoice status remains payment_pending
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'payment_pending']);

        // 2. Admin confirms cash payment (POST /api/payments/{id}/confirm-cash)
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Operator Admin',
            'email' => 'admin@test.local',
            'mobile' => '9999999991',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $confirmResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/payments/{$paymentId}/confirm-cash");

        $confirmResponse->assertStatus(200);
        $this->assertEquals('success', $confirmResponse->json('data.status'));

        Mail::assertSent(TemplateMail::class);

        // Invoice status should now be PAID
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'paid']);
        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'paid']);

        // 3. Prevent duplicate confirmations (should throw 422)
        $dupConfirmResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/payments/{$paymentId}/confirm-cash");
        $dupConfirmResponse->assertStatus(422);
    }

    public function test_online_payment_and_webhook_flow()
    {
        Mail::fake();

        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Subisha Customer',
            'email' => 'subisha3@test.local',
            'mobile' => '9999999944',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $booking = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'booking_code' => 'BK-TESTONLINE',
            'booking_type' => 'individual',
            'pickup_location' => 'A',
            'drop_location' => 'B',
            'booking_date' => date('Y-m-d'),
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'passenger_count' => 2,
            'estimated_distance_km' => 10.0,
            'estimated_fare' => 236.0,
            'status' => 'completed',
        ]);

        $invoice = Invoice::create([
            'operator_id' => $this->operatorId,
            'booking_id' => $booking->id,
            'invoice_number' => 'INV-2026-999993',
            'invoice_type' => 'individual',
            'subtotal' => 200.00,
            'tax_amount' => 36.00,
            'total_amount' => 236.00,
            'status' => 'payment_pending',
            'issued_at' => now(),
        ]);

        // 1. Initiate online payment
        $payOnlineResponse = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/invoices/{$invoice->id}/pay/online");

        $payOnlineResponse->assertStatus(200);
        $this->assertNotNull($payOnlineResponse->json('paymentUrl'));

        // Retrieve transaction ID
        $payment = Payment::where('invoice_id', $invoice->id)->first();
        $this->assertNotNull($payment);
        $this->assertEquals('pending', $payment->status);
        $transactionId = $payment->transaction_id;

        // 2. Gateway Webhook Success simulation (POST /api/payments/webhook)
        $webhookResponse = $this->postJson("/api/payments/webhook", [
            'transaction_id' => $transactionId,
            'status' => 'success',
        ]);

        $webhookResponse->assertStatus(200);

        Mail::assertSent(TemplateMail::class);

        // Verify Payment is success, Invoice is paid
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'success']);
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'paid']);

        // 3. Webhook Idempotency: duplicate webhook should just return 200 OK without errors
        $dupWebhookResponse = $this->postJson("/api/payments/webhook", [
            'transaction_id' => $transactionId,
            'status' => 'success',
        ]);

        $dupWebhookResponse->assertStatus(200);
        $this->assertStringContainsString('Webhook already processed', $dupWebhookResponse->json('message'));
    }

    public function test_pdf_generation()
    {
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Operator Admin',
            'email' => 'admin2@test.local',
            'mobile' => '9999999995',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $invoice = Invoice::create([
            'operator_id' => $this->operatorId,
            'invoice_number' => 'INV-2026-999994',
            'invoice_type' => 'individual',
            'subtotal' => 200.00,
            'tax_amount' => 36.00,
            'total_amount' => 236.00,
            'status' => 'payment_pending',
            'issued_at' => now(),
        ]);
        
        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Subisha Customer',
            'email' => 'subisha4@test.local',
            'mobile' => '9999999955',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::create([
            'operator_id' => $this->operatorId,
            'vehicle_type' => 'Toyota Innova',
            'vehicle_number' => 'TN-72-AX-1235',
            'seating_capacity' => 7,
            'price_per_km' => 20.00,
            'status' => 'available',
        ]);

        $booking = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'booking_code' => 'BK-PDF1',
            'booking_type' => 'individual',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'booking_date' => date('Y-m-d'),
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'passenger_count' => 3,
            'estimated_distance_km' => 25.00,
            'estimated_fare' => 500.00,
            'status' => 'completed',
        ]);

        $invoice->update(['booking_id' => $booking->id]);

        // GET /api/invoices/{id}/pdf
        $response = $this->actingAs($admin, 'sanctum')
            ->get("/api/invoices/{$invoice->id}/pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }
}
