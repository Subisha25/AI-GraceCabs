<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Operator;
use App\Models\Organization;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Contract;
use App\Models\Booking;
use App\Models\Trip;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\ContractBillingService;
use Carbon\Carbon;

class ContractBillingTest extends TestCase
{
    use RefreshDatabase;

    protected string $operatorId = 'e111111d-2e65-4d7a-85d1-125035feee1a';

    protected function setUp(): void
    {
        parent::setUp();

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

    public function test_organization_creation_and_user_isolation()
    {
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Operator Admin',
            'email' => 'admin@test.local',
            'mobile' => '9999999991',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // 1. Create Organization via API
        $orgResponse = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/organizations', [
                'name' => 'ABC School',
                'type' => 'school',
                'contact_person' => 'Principal Murugan',
                'email' => 'principal@abc.local',
                'phone' => '9000000001',
                'address' => 'Surandai Campus',
                'pickup_location' => 'Gate A',
                'drop_location' => 'Town Route',
                'billing_address' => 'Accounts Dept, Surandai',
                'billing_contact_name' => 'Accounts Officer',
                'billing_contact_email' => 'accounts@abc.local',
                'billing_contact_phone' => '9000000002',
                'status' => 'active',
            ]);

        $orgResponse->assertStatus(201);
        $orgId = $orgResponse->json('data.id');
        $this->assertNotNull($orgId);

        // 2. Create Organization manager (dynamic user)
        $managerUser = User::create([
            'operator_id' => $this->operatorId,
            'organization_id' => $orgId,
            'name' => 'School Coordinator',
            'email' => 'coordinator@abc.local',
            'mobile' => '9000000003',
            'password' => bcrypt('password123'),
            'role' => 'manager',
            'status' => 'active',
        ]);

        // 3. Create another organization to verify isolation
        $orgB = Organization::create([
            'operator_id' => $this->operatorId,
            'name' => 'XYZ College',
            'type' => 'college',
            'contact_person' => 'Dean XYZ',
            'email' => 'dean@xyz.local',
            'phone' => '9000000005',
            'address' => 'XYZ Campus',
            'billing_address' => 'XYZ Accounts',
            'billing_contact_name' => 'Billing Chief',
            'billing_contact_email' => 'billing@xyz.local',
            'billing_contact_phone' => '9000000006',
            'status' => 'active',
        ]);

        $contractB = Contract::create([
            'operator_id' => $this->operatorId,
            'organization_id' => $orgB->id,
            'contract_name' => 'XYZ Shuttle',
            'contract_type' => 'km_based',
            'pricing_model' => 'PER_KM',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'pickup_location' => 'XYZ Gate',
            'drop_location' => 'XYZ Campus',
            'working_days' => 20,
            'rate_per_km' => 15.00,
            'status' => 'active',
        ]);

        // Manager from ABC School tries to access XYZ College contract details
        $respShow = $this->actingAs($managerUser, 'sanctum')
            ->getJson("/api/contracts/{$contractB->id}");
        $respShow->assertStatus(404); // Scoping blocks access, returns 404 Not Found

        // Manager listing contracts should only return ABC School contracts (which is currently empty)
        $respList = $this->actingAs($managerUser, 'sanctum')
            ->getJson('/api/contracts');
        $respList->assertStatus(200);
        $this->assertCount(0, $respList->json('data'));
    }

    public function test_contract_overlap_validation()
    {
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Operator Admin',
            'email' => 'admin@test.local',
            'mobile' => '9999999991',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $org = Organization::create([
            'operator_id' => $this->operatorId,
            'name' => 'ABC School',
            'type' => 'school',
            'contact_person' => 'Principal',
            'email' => 'principal@abc.local',
            'phone' => '9000000001',
            'address' => 'Surandai',
            'billing_address' => 'Accounts Dept',
            'billing_contact_name' => 'Accounts Officer',
            'billing_contact_email' => 'accounts@abc.local',
            'billing_contact_phone' => '9000000002',
            'status' => 'active',
        ]);

        // Contract 1: Aug 1 -> Aug 31
        Contract::create([
            'operator_id' => $this->operatorId,
            'organization_id' => $org->id,
            'contract_name' => 'Contract Aug',
            'contract_type' => 'km_based',
            'pricing_model' => 'PER_KM',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'working_days' => 22,
            'rate_per_km' => 15.00,
            'status' => 'active',
        ]);

        // Contract 2 (Overlap): Aug 15 -> Sep 15
        $overlapResponse = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/contracts', [
                'organization_id' => $org->id,
                'contract_name' => 'Contract Overlap',
                'contract_type' => 'km_based',
                'pricing_model' => 'PER_KM',
                'start_date' => '2026-08-15',
                'end_date' => '2026-09-15',
                'pickup_location' => 'Pickup',
                'drop_location' => 'Drop',
                'working_days' => 22,
                'rate_per_km' => 15.00,
                'status' => 'active',
            ]);

        $overlapResponse->assertStatus(422);
        $this->assertStringContainsString('already exists', strtolower($overlapResponse->json('message')));
    }

    public function test_monthly_billing_calculations_per_km_and_fixed()
    {
        $org = Organization::create([
            'operator_id' => $this->operatorId,
            'name' => 'ABC School',
            'type' => 'school',
            'contact_person' => 'Principal',
            'email' => 'principal@abc.local',
            'phone' => '9000000001',
            'address' => 'Surandai',
            'billing_address' => 'Accounts Dept',
            'billing_contact_name' => 'Accounts Officer',
            'billing_contact_email' => 'accounts@abc.local',
            'billing_contact_phone' => '9000000002',
            'status' => 'active',
        ]);

        // 1. Create PER_KM pricing contract (tax rate configurable, set to 5%)
        $contractPerKm = Contract::create([
            'operator_id' => $this->operatorId,
            'organization_id' => $org->id,
            'contract_name' => 'Per KM Contract',
            'contract_type' => 'km_based',
            'pricing_model' => 'PER_KM',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'working_days' => 22,
            'rate_per_km' => 12.00, // 12 INR/KM
            'tax_rate_percent' => 5.00, // 5% configurable tax
            'status' => 'active',
        ]);

        // Create completed trip bookings under contract
        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'School Coord',
            'email' => 'coord@abc.local',
            'mobile' => '9000000011',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $booking1 = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'organization_id' => $org->id,
            'contract_id' => $contractPerKm->id,
            'booking_code' => 'BK-C1',
            'booking_type' => 'organization',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'booking_date' => '2026-08-10',
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'estimated_distance_km' => 50.00,
            'actual_distance_km' => 50.00,
            'estimated_fare' => 600.00,
            'status' => 'completed',
        ]);

        $booking2 = Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'organization_id' => $org->id,
            'contract_id' => $contractPerKm->id,
            'booking_code' => 'BK-C2',
            'booking_type' => 'organization',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'booking_date' => '2026-08-12',
            'booking_time' => '10:00:00',
            'trip_type' => 'one_way',
            'estimated_distance_km' => 50.00,
            'actual_distance_km' => 50.00,
            'estimated_fare' => 600.00,
            'status' => 'completed',
        ]);

        // Generate invoice using billing service
        $billingService = resolve(ContractBillingService::class);
        $invoicePerKm = $billingService->generateInvoice($this->operatorId, $org->id, $contractPerKm->id, '2026-08');

        // Calculations:
        // Total KM = 50 + 50 = 100 KM
        // Base Amount = 100 KM * 12 INR/KM = 1200 INR
        // Tax (5%) = 1200 * 5% = 60 INR
        // Total = 1260 INR
        $this->assertEquals(1200.00, $invoicePerKm->subtotal);
        $this->assertEquals(60.00, $invoicePerKm->tax_amount);
        $this->assertEquals(1260.00, $invoicePerKm->total_amount);
        $this->assertEquals('issued', $invoicePerKm->status);

        // 2. Immutability check: modifying contract pricing later must NOT change already generated invoice values
        $contractPerKm->update(['rate_per_km' => 20.00]);
        $invoiceCheck = Invoice::find($invoicePerKm->id);
        $this->assertEquals(1200.00, $invoiceCheck->subtotal); // Remains stable at 1200

        // 3. Create FIXED_MONTHLY pricing contract (tax rate configurable, set to 0.0%)
        $contractFixed = Contract::create([
            'operator_id' => $this->operatorId,
            'organization_id' => $org->id,
            'contract_name' => 'Fixed Monthly Contract',
            'contract_type' => 'monthly_fixed',
            'pricing_model' => 'FIXED_MONTHLY',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'pickup_location' => 'Pickup',
            'drop_location' => 'Drop',
            'working_days' => 22,
            'rate_per_km' => 0.00,
            'monthly_fixed_amount' => 50000.00, // 50000 INR
            'tax_rate_percent' => 0.00, // Configurable tax is 0.0%
            'status' => 'active',
        ]);

        $invoiceFixed = $billingService->generateInvoice($this->operatorId, $org->id, $contractFixed->id, '2026-08');
        
        // Calculations:
        // Base = 50000 INR
        // Tax (0%) = 0 INR
        // Total = 50000 INR
        $this->assertEquals(50000.00, $invoiceFixed->subtotal);
        $this->assertEquals(0.00, $invoiceFixed->tax_amount);
        $this->assertEquals(50000.00, $invoiceFixed->total_amount);

        // 4. Idempotency test: generating invoice again for same period returns the same invoice without duplicating
        $invoiceFixedDuplicate = $billingService->generateInvoice($this->operatorId, $org->id, $contractFixed->id, '2026-08');
        $this->assertEquals($invoiceFixed->id, $invoiceFixedDuplicate->id);
    }

    public function test_service_day_calculation_logic()
    {
        // Test Mon-Fri inside August 2026 (01-08-2026 to 31-08-2026) -> Monday is 3, 10, 17, 24, 31 (5), Tue (4), Wed (4), Thu (4), Fri (4) -> Total 21 days
        $count1 = Contract::calculateServiceDaysCount('2026-08-01', '2026-08-31', 'Monday-Friday');
        $this->assertEquals(21, $count1);

        // Test Mon-Sat inside August 2026 -> Mon-Fri (21) + Saturday is 1, 8, 15, 22, 29 (5) -> Total 26 days
        $count2 = Contract::calculateServiceDaysCount('2026-08-01', '2026-08-31', 'Mon-Sat');
        $this->assertEquals(26, $count2);

        // Test Mon,Wed,Fri inside August 2026 -> Monday (5) + Wednesday (4) + Friday (4) -> Total 13 days
        $count3 = Contract::calculateServiceDaysCount('2026-08-01', '2026-08-31', 'Mon,Wed,Fri');
        $this->assertEquals(13, $count3);
    }

    public function test_schedule_generation_endpoint()
    {
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Operator Admin',
            'email' => 'admin@test.local',
            'mobile' => '9999999991',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $org = Organization::create([
            'operator_id' => $this->operatorId,
            'name' => 'ABC School',
            'type' => 'school',
            'contact_person' => 'Principal',
            'email' => 'principal@abc.local',
            'phone' => '9000000001',
            'address' => 'Surandai',
            'billing_address' => 'Accounts Dept',
            'billing_contact_name' => 'Accounts Officer',
            'billing_contact_email' => 'accounts@abc.local',
            'billing_contact_phone' => '9000000002',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::create([
            'operator_id' => $this->operatorId,
            'vehicle_name' => 'Tempo Traveler',
            'vehicle_number' => 'TN-07-CTR-2026',
            'price_per_km' => 15.00,
            'seating_capacity' => 12,
            'status' => 'active',
        ]);

        // Active contract valid from Aug 1st to Aug 15th 2026 (Mon-Fri)
        // Mon-Fri inside Aug 1-15: Mon (3, 10), Tue (4, 11), Wed (5, 12), Thu (6, 13), Fri (7, 14) -> Total 10 days
        $contract = Contract::create([
            'operator_id' => $this->operatorId,
            'organization_id' => $org->id,
            'contract_name' => 'ABC School Shuttle',
            'contract_type' => 'km_based',
            'pricing_model' => 'PER_KM',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-15',
            'pickup_location' => 'Gate A',
            'drop_location' => 'Campus B',
            'working_days' => 10,
            'rate_per_km' => 15.00,
            'service_days' => 'Monday-Friday',
            'vehicle_id' => $vehicle->id,
            'status' => 'active',
        ]);

        // Call schedule generator endpoint as admin
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/generate-schedule", [
                'billing_period' => '2026-08'
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);

        // Assert 10 bookings were created
        $bookingsCount = Booking::where('contract_id', $contract->id)->count();
        $this->assertEquals(10, $bookingsCount);

        // Verify Saturday Aug 8th has no booking
        $satBookingExists = Booking::where('contract_id', $contract->id)
            ->where('booking_date', '2026-08-08')
            ->exists();
        $this->assertFalse($satBookingExists);

        // Verify Friday Aug 7th has a booking
        $friBookingExists = Booking::where('contract_id', $contract->id)
            ->where('booking_date', '2026-08-07')
            ->exists();
        $this->assertTrue($friBookingExists);

        // Verify idempotency: call again, shouldn't create duplicates
        $responseDuplicate = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/generate-schedule", [
                'billing_period' => '2026-08'
            ]);

        $responseDuplicate->assertStatus(200);
        
        $bookingsCountAfter = Booking::where('contract_id', $contract->id)->count();
        $this->assertEquals(10, $bookingsCountAfter); // Still 10!
    }

    public function test_multiple_route_stops_and_locked_taxes()
    {
        $admin = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Admin User',
            'email' => 'admin.stops.taxes@platform.local',
            'mobile' => '9991112224',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $org = Organization::create([
            'operator_id' => $this->operatorId,
            'name' => 'St. Joseph College',
            'type' => 'college',
            'contact_person' => 'Father Principal',
            'email' => 'admin@stjoseph.local',
            'phone' => '9111111111',
            'address' => 'Tenkasi',
            'billing_address' => 'Accounts Office',
            'allow_tax' => true,
            'billing_contact_name' => 'Accounts Clerk',
            'billing_contact_email' => 'billing@stjoseph.local',
            'billing_contact_phone' => '9111111112',
            'status' => 'active',
        ]);

        $cgst = \App\Models\Tax::create([
            'operator_id' => $this->operatorId,
            'tax_name' => 'CGST Master',
            'tax_type' => 'CGST',
            'percentage' => 2.50,
            'status' => 'active',
        ]);

        $sgst = \App\Models\Tax::create([
            'operator_id' => $this->operatorId,
            'tax_name' => 'SGST Master',
            'tax_type' => 'SGST',
            'percentage' => 2.50,
            'status' => 'active',
        ]);

        $vehicle = Vehicle::create([
            'operator_id' => $this->operatorId,
            'vehicle_name' => 'Mini Bus',
            'vehicle_number' => 'TN-72-C-1234',
            'vehicle_type' => 'Bus',
            'capacity' => 25,
            'status' => 'active',
        ]);

        // Create Contract with stops and taxes
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/contracts', [
                'organization_id' => $org->id,
                'contract_name' => 'St. Joseph Staff Transport',
                'contract_type' => 'km_based',
                'pricing_model' => 'PER_KM',
                'start_date' => '2026-08-01',
                'end_date' => '2026-08-31',
                'pickup_location' => 'Surandai',
                'drop_location' => 'Tenkasi',
                'working_days' => 22,
                'rate_per_km' => 20.00,
                'vehicle_id' => $vehicle->id,
                'status' => 'active',
                'stops' => [
                    ['stop_name' => 'Surandai', 'address' => 'Stop 1 Address', 'sequence' => 1],
                    ['stop_name' => 'Alangulam', 'address' => 'Stop 2 Address', 'sequence' => 2],
                    ['stop_name' => 'Tenkasi', 'address' => 'Stop 3 Address', 'sequence' => 3],
                ],
                'taxes' => [$cgst->id, $sgst->id]
            ]);

        $response->assertStatus(201);
        $contractId = $response->json('data.id');

        // Assert database stops
        $this->assertDatabaseHas('contract_stops', [
            'contract_id' => $contractId,
            'stop_name' => 'Alangulam',
            'sequence' => 2
        ]);
        $this->assertEquals(3, DB::table('contract_stops')->where('contract_id', $contractId)->count());

        // Assert database taxes
        $this->assertDatabaseHas('contract_taxes', [
            'contract_id' => $contractId,
            'tax_id' => $cgst->id,
            'percentage' => 2.50
        ]);
        $this->assertEquals(2, DB::table('contract_taxes')->where('contract_id', $contractId)->count());

        // Update master CGST rate to 10% (simulates later master changes)
        $cgst->update(['percentage' => 10.00]);

        // Create completed bookings
        $customer = User::create([
            'operator_id' => $this->operatorId,
            'name' => 'Coord',
            'email' => 'coord.stjoseph@platform.local',
            'mobile' => '9998887771',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'organization_id' => $org->id,
            'contract_id' => $contractId,
            'booking_code' => 'BK-STJ-1',
            'booking_type' => 'organization',
            'pickup_location' => 'Surandai',
            'drop_location' => 'Tenkasi',
            'booking_date' => '2026-08-05',
            'booking_time' => '08:30:00',
            'status' => 'completed',
            'actual_distance_km' => 50.00,
        ]);

        Booking::create([
            'operator_id' => $this->operatorId,
            'user_id' => $customer->id,
            'organization_id' => $org->id,
            'contract_id' => $contractId,
            'booking_code' => 'BK-STJ-2',
            'booking_type' => 'organization',
            'pickup_location' => 'Surandai',
            'drop_location' => 'Tenkasi',
            'booking_date' => '2026-08-06',
            'booking_time' => '08:30:00',
            'status' => 'completed',
            'actual_distance_km' => 50.00,
        ]);

        // Generate Invoice
        $billingService = resolve(ContractBillingService::class);
        $invoice = $billingService->generateInvoice($this->operatorId, $org->id, $contractId, '2026-08');

        // Calculations:
        // Total KM = 100 KM
        // Rate = ₹20/KM
        // Base Amount = ₹2,000
        // Locked taxes: CGST (2.5%), SGST (2.5%) => Total 5% tax = ₹100
        // Grand Total = ₹2,100
        $this->assertEquals(2000.00, $invoice->subtotal);
        $this->assertEquals(100.00, $invoice->tax_amount); // 5% total tax (using locked rates), not 12.5%!
        $this->assertEquals(2100.00, $invoice->total_amount);

        // Verify tax details array
        $taxDetails = $invoice->tax_details;
        $this->assertCount(2, $taxDetails);
        $this->assertEquals('CGST Master', $taxDetails[0]['tax_name']);
        $this->assertEquals(2.50, $taxDetails[0]['percentage']);
        $this->assertEquals(50.00, $taxDetails[0]['amount']);
    }
}
