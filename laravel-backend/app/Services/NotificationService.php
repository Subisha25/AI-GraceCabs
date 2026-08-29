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
     * Send email notification.
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
     * Send SMS notification.
     */
    protected function sendSms(string $phone, string $message): bool
    {
        if (empty($phone)) {
            // For general OTP code send without user profile, try to extract mobile from cache or message context
            // Or log warning
            Log::warning("NotificationService: SMS phone number is empty.");
            return false;
        }
        return $this->smsProvider->send($phone, $message);
    }

    /**
     * Send WhatsApp notification.
     */
    protected function sendWhatsapp(string $phone, string $message): bool
    {
        if (empty($phone)) {
            Log::warning("NotificationService: WhatsApp phone number is empty.");
            return false;
        }

        $metaToken = env('META_WHATSAPP_TOKEN');
        $phoneNumberId = env('META_WHATSAPP_PHONE_ID');

        if (empty($metaToken) || empty($phoneNumberId)) {
            Log::warning("WhatsApp NOT CONFIGURED. Skipping delivery for {$phone}.");
            return false;
        }

        try {
            $formattedNumber = str_starts_with($phone, '+') ? $phone : "+91" . preg_replace('/[^0-9]/', '', $phone);
            
            $url = "https://graph.facebook.com/v21.0/{$phoneNumberId}/messages";
            $response = Http::withToken($metaToken)->post($url, [
                'messaging_product' => 'whatsapp',
                'to' => $formattedNumber,
                'type' => 'text',
                'text' => [
                    'body' => $message
                ]
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp message successfully sent to {$formattedNumber} via Meta API.");
                return true;
            }

            Log::error("Meta WhatsApp API responded with error: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Failed to send WhatsApp message via Meta: " . $e->getMessage());
            return false;
        }
    }
}
