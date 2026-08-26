<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsProvider
{
    protected ?string $apiKey;
    protected ?string $senderId;

    public function __construct()
    {
        $this->apiKey = env('TWO_FACTOR_API_KEY');
        $this->senderId = env('TWO_FACTOR_SENDER_ID', 'SWIFTR');
    }

    /**
     * Send SMS to a recipient.
     */
    public function send(string $to, string $message): bool
    {
        if (empty($to)) {
            Log::warning("SmsProvider: Recipient phone number is empty.");
            return false;
        }

        // Standardize phone number for 2factor (remove leading '+' and ensure 10-digit format for India)
        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        if (strlen($cleanPhone) > 10 && str_starts_with($cleanPhone, '91')) {
            $cleanPhone = substr($cleanPhone, 2);
        }

        if (empty($this->apiKey)) {
            Log::warning("SmsProvider: TWO_FACTOR_API_KEY is missing in .env. Cannot send SMS.");
            if (app()->environment('testing')) {
                Log::info("SMS Mock Sent (Testing environment): {$to} (cleaned: {$cleanPhone}). Message: \"{$message}\"");
                return true;
            }
            return false;
        }

        try {
            // Check if OTP code pattern exists in message (e.g. verification code is: 123456)
            if (preg_match('/verification code is:\s*([0-9]{6})/i', $message, $matches)) {
                $otpVal = $matches[1];
                // For OTP, 2Factor has a clean transactional AUTOGEN SMS route:
                // https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/{otp_val}/
                $url = "https://2factor.in/API/V1/{$this->apiKey}/SMS/{$cleanPhone}/{$otpVal}/SwiftRideOTP";
                $response = Http::get($url);
            } else {
                // Otherwise use addon single SMS endpoint
                $url = "https://2factor.in/API/V1/{$this->apiKey}/ADDON_SERVICES/SEND/SINGLE_SMS";
                $response = Http::post($url, [
                    'to' => $cleanPhone,
                    'from' => $this->senderId,
                    'msg' => $message
                ]);
            }

            if ($response->successful()) {
                Log::info("SMS successfully sent to {$to} via 2Factor.");
                return true;
            }

            Log::error("2Factor SMS responded with error: {$response->body()} for recipient {$to}.");
            return false;
        } catch (\Exception $e) {
            Log::error("Failed to send SMS to {$to} via 2Factor: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Transactional DLT approved Template SMS via 2Factor.
     */
    public function sendTemplate(string $to, string $templateName, array $variables): bool
    {
        if (empty($to)) {
            Log::warning("SmsProvider: Recipient phone number is empty.");
            return false;
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        if (strlen($cleanPhone) > 10 && str_starts_with($cleanPhone, '91')) {
            $cleanPhone = substr($cleanPhone, 2);
        }

        if (empty($this->apiKey)) {
            Log::warning("SmsProvider: TWO_FACTOR_API_KEY is missing in .env. Cannot send template SMS.");
            if (app()->environment('testing')) {
                Log::info("SMS Template '{$templateName}' Mock Sent (Testing environment): {$to} (cleaned: {$cleanPhone}). Variables: " . json_encode($variables));
                return true;
            }
            return false;
        }

        try {
            $query = [
                'module' => 'TRANS_SMS',
                'apikey' => $this->apiKey,
                'to' => $cleanPhone,
                'from' => $this->senderId,
                'templatename' => $templateName,
            ];

            foreach ($variables as $index => $value) {
                $query['var' . ($index + 1)] = $value;
            }

            $url = 'https://2factor.in/API/R1/?' . http_build_query($query);
            $response = Http::get($url);

            if ($response->successful()) {
                Log::info("SMS Template '{$templateName}' successfully sent to {$to} via 2Factor.");
                return true;
            }

            Log::error("2Factor responded with error: {$response->body()} for recipient {$to}.");
            return false;
        } catch (\Exception $e) {
            Log::error("Failed to send 2Factor SMS template to {$to}: " . $e->getMessage());
            return false;
        }
    }
}
