<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Notification;
use App\Services\NotificationService;
use App\Services\SmsProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \App\Models\Operator::firstOrCreate(
            ['id' => 'op-test-1'],
            [
                'name' => 'Test Operator',
                'email' => 'operator@test.local',
                'phone' => '9841722675',
                'address' => 'Chennai, Tamil Nadu'
            ]
        );
    }

    public function test_sms_provider_handles_testing_mock_successfully(): void
    {
        $smsProvider = app(SmsProvider::class);
        $result = $smsProvider->send('9080280818', 'Your Grace Cabs OTP is 123456');
        $this->assertTrue($result);
    }

    public function test_sms_provider_handles_template_in_testing(): void
    {
        $smsProvider = app(SmsProvider::class);
        $result = $smsProvider->sendTemplate('9080280818', 'Driver Assigning', ['Driver Ramesh', 'Customer John']);
        $this->assertTrue($result);
    }

    public function test_notification_service_dispatches_email_and_sms(): void
    {
        $notifService = app(NotificationService::class);
        
        $notif = $notifService->send(
            'op-test-1',
            null,
            'booking_confirmed',
            'sms',
            'Booking Confirmed',
            'Your ride is confirmed with driver Ramesh.',
            null,
            null,
            '9080280818'
        );

        $this->assertInstanceOf(Notification::class, $notif);
        $this->assertEquals('sent', $notif->status);
        $this->assertEquals('sms', $notif->channel);
    }

    public function test_notification_service_dispatches_whatsapp(): void
    {
        $notifService = app(NotificationService::class);
        
        $notif = $notifService->send(
            'op-test-1',
            null,
            'trip_started',
            'whatsapp',
            'Trip Started',
            'Your trip has started.',
            null,
            null,
            '9080280818'
        );

        $this->assertInstanceOf(Notification::class, $notif);
        $this->assertEquals('sent', $notif->status);
        $this->assertEquals('whatsapp', $notif->channel);
    }
}
