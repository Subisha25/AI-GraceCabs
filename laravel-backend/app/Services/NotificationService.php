<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Booking;
use App\Models\Invoice;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Mail\TemplateMail;

class NotificationService
{
    protected SmsProvider $smsProvider;

    public function __construct(SmsProvider $smsProvider)
    {
        $this->smsProvider = $smsProvider;
    }

    /**
     * Smart dispatcher to notify a user across all configured and available channels.
     */
    public function notifyUser(
        string $operatorId,
        ?User $user,
        string $type,
        string $title,
        string $message,
        ?string $bookingId = null,
        ?string $invoiceId = null,
        ?string $pdfPath = null
    ): void {
        if (!$user) {
            Log::warning("NotificationService notifyUser: User object is null.");
            return;
        }

        // 1. Send Email if email exists
        if (!empty($user->email)) {
            $this->send($operatorId, $user->id, $type, 'email', $title, $message, $bookingId, $invoiceId, null, $pdfPath);
        }

        // 2. Send SMS if mobile exists
        if (!empty($user->mobile)) {
            $this->send($operatorId, $user->id, $type, 'sms', $title, $message, $bookingId, $invoiceId, null, $pdfPath);
        }

        // 3. Send WhatsApp if mobile exists
        if (!empty($user->mobile)) {
            $this->send($operatorId, $user->id, $type, 'whatsapp', $title, $message, $bookingId, $invoiceId, null, $pdfPath);
        }
    }

    /**
     * Dispatch notification record and send actual templates via appropriate channels.
     */
    public function send(
        string $operatorId,
        ?string $userId,
        string $type,
        string $channel,
        string $title,
        string $message,
        ?string $bookingId = null,
        ?string $invoiceId = null,
        ?string $customRecipient = null,
        ?string $pdfPath = null
    ): Notification {
        // Create database record
        $notif = Notification::create([
            'operator_id' => $operatorId,
            'user_id' => $userId,
            'booking_id' => $bookingId,
            'invoice_id' => $invoiceId,
            'type' => $type,
            'channel' => $channel,
            'title' => $title,
            'message' => $message,
            'status' => 'pending',
        ]);

        $recipient = $userId ? User::find($userId) : null;
        $recipientMobile = $recipient ? $recipient->mobile : $customRecipient;
        $recipientEmail = $recipient ? $recipient->email : $customRecipient;

        try {
            $success = false;

            switch (strtolower($channel)) {
                case 'email':
                    $success = $this->sendEmail($recipientEmail, $title, $message, $pdfPath);
                    break;

                case 'sms':
                    $success = $this->sendSms($recipientMobile ?? '', $message);
                    break;

                case 'whatsapp':
                    $success = $this->sendWhatsapp($recipientMobile ?? '', $message);
                    break;

                default:
                    Log::warning("NotificationService: Unsupported channel '{$channel}'.");
                    $success = true; // Fallback no-op
                    break;
            }

            if ($success) {
                $notif->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
            } else {
                $notif->update([
                    'status' => 'failed',
                ]);
            }

        } catch (\Exception $e) {
            Log::error("Failed to send notification via channel {$channel}: " . $e->getMessage());
            $notif->update([
                'status' => 'failed',
            ]);
        }

        return $notif;
    }

    /**
     * Send email notification via Laravel SMTP.
     */
    protected function sendEmail(?string $email, string $title, string $message, ?string $pdfPath = null): bool
    {
        if (empty($email)) {
            Log::warning("NotificationService: Email address is empty.");
            return false;
        }

        try {
            Mail::to($email)->send(new TemplateMail($title, $message, $pdfPath));
            return true;
        } catch (\Exception $e) {
            Log::error("Email sending failed to {$email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send SMS notification via Node.js Notification Microservice.
     */
    protected function sendSms(string $phone, string $message): bool
    {
        if (empty($phone)) {
            Log::warning("NotificationService: SMS phone number is empty.");
            return false;
        }
        return $this->smsProvider->send($phone, $message);
    }

    /**
     * Send WhatsApp notification via Node.js Notification Microservice.
     */
    protected function sendWhatsapp(string $phone, string $message): bool
    {
        if (empty($phone)) {
            Log::warning("NotificationService: WhatsApp phone number is empty.");
            return false;
        }

        $nodeServiceUrl = env('NOTIFICATION_SERVICE_URL', 'http://127.0.0.1:5001');
        $serviceToken = env('NOTIFICATION_SERVICE_TOKEN', 'grace_internal_notif_sec_key_2026');

        if (empty($nodeServiceUrl)) {
            Log::warning("NotificationService: NOTIFICATION_SERVICE_URL is not configured.");
            return false;
        }

        if (app()->environment('testing')) {
            Log::info("WhatsApp Mock Sent (Testing environment): {$phone}. Message: \"{$message}\"");
            return true;
        }

        try {
            $response = Http::withToken($serviceToken)
                ->timeout(5)
                ->post("{$nodeServiceUrl}/api/notifications/whatsapp", [
                    'to' => $phone,
                    'message' => $message,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['success'])) {
                    Log::info("WhatsApp message successfully sent via Node Notification Service to {$phone}. MessageID: " . ($data['messageId'] ?? 'sent'));
                    return true;
                } elseif (($data['status'] ?? '') === 'configuration_missing') {
                    Log::warning("WhatsApp NOT CONFIGURED in Node notification service. Skipping delivery for {$phone}.");
                    return false;
                }
            }

            Log::error("Node notification service WhatsApp error for {$phone}: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Failed to send WhatsApp message via Node notification service to {$phone}: " . $e->getMessage());
            return false;
        }
    }
}
