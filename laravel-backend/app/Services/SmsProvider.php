<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsProvider
{
    protected ?string $nodeServiceUrl;
    protected ?string $serviceToken;

    public function __construct()
    {
        $this->nodeServiceUrl = env('NOTIFICATION_SERVICE_URL', 'http://127.0.0.1:5001');
        $this->serviceToken = env('NOTIFICATION_SERVICE_TOKEN', 'grace_internal_notif_sec_key_2026');
    }

    /**
     * Send SMS to a recipient via Node.js Notification Microservice.
     */
    public function send(string $to, string $message): bool
    {
        if (empty($to)) {
            Log::warning("SmsProvider: Recipient phone number is empty.");
            return false;
        }

        if (empty($this->nodeServiceUrl)) {
            Log::warning("SmsProvider: NOTIFICATION_SERVICE_URL is missing in .env.");
            return false;
        }

        if (app()->environment('testing')) {
            Log::info("SMS Mock Sent (Testing environment): {$to}. Message: \"{$message}\"");
            return true;
        }

        try {
            $response = Http::withToken($this->serviceToken)
                ->timeout(5)
                ->post("{$this->nodeServiceUrl}/api/notifications/sms", [
                    'to' => $to,
                    'message' => $message,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['success'])) {
                    Log::info("SMS successfully sent to {$to} via Node Notification Service. MessageID: " . ($data['messageId'] ?? 'sent'));
                    return true;
                } elseif (($data['status'] ?? '') === 'configuration_missing') {
                    Log::warning("SMS configuration missing in Node notification service for {$to}.");
                    return false;
                }
            }

            Log::error("Node notification service SMS responded with error: " . $response->body() . " for recipient {$to}.");
            return false;
        } catch (\Exception $e) {
            Log::error("Failed to connect to Node notification service for SMS to {$to}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Transactional DLT approved Template SMS via Node.js Notification Microservice.
     */
    public function sendTemplate(string $to, string $templateName, array $variables): bool
    {
        if (empty($to)) {
            Log::warning("SmsProvider: Recipient phone number is empty.");
            return false;
        }

        if (empty($this->nodeServiceUrl)) {
            Log::warning("SmsProvider: NOTIFICATION_SERVICE_URL is missing in .env.");
            return false;
        }

        if (app()->environment('testing')) {
            Log::info("SMS Template '{$templateName}' Mock Sent (Testing environment): {$to}. Variables: " . json_encode($variables));
            return true;
        }

        try {
            $response = Http::withToken($this->serviceToken)
                ->timeout(5)
                ->post("{$this->nodeServiceUrl}/api/notifications/sms/template", [
                    'to' => $to,
                    'templateName' => $templateName,
                    'variables' => $variables,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['success'])) {
                    Log::info("SMS Template '{$templateName}' successfully sent to {$to} via Node Notification Service. MessageID: " . ($data['messageId'] ?? 'sent'));
                    return true;
                } elseif (($data['status'] ?? '') === 'configuration_missing') {
                    Log::warning("SMS configuration missing in Node notification service for {$to}.");
                    return false;
                }
            }

            Log::error("Node notification service SMS template responded with error: " . $response->body() . " for recipient {$to}.");
            return false;
        } catch (\Exception $e) {
            Log::error("Failed to connect to Node notification service for template SMS to {$to}: " . $e->getMessage());
            return false;
        }
    }
}
