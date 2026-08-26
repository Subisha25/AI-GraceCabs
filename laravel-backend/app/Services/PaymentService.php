<?php

namespace App\Services;

use App\Models\Invoice;

class PaymentService
{
    /**
     * Initializes gateway payment session and returns paymentUrl.
     */
    public function createPaymentSession(Invoice $invoice, string $method): array
    {
        $transactionId = 'TXN-ONLINE-' . strtoupper(bin2hex(random_bytes(6)));
        
        // Simulating redirect URL for online payment
        $paymentUrl = "https://mock-gateway.hdfc.com/pay/" . $invoice->id . "?tx=" . $transactionId;

        return [
            'success' => true,
            'paymentUrl' => $paymentUrl,
            'transaction_id' => $transactionId,
        ];
    }
}
