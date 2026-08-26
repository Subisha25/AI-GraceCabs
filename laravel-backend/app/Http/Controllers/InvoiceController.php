<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Driver;
use App\Services\PaymentService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    protected PaymentService $paymentService;
    protected NotificationService $notificationService;

    public function __construct(PaymentService $paymentService, NotificationService $notificationService)
    {
        $this->paymentService = $paymentService;
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Invoice::query();

        if ($user->role === 'customer') {
            $query->whereHas('booking', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } elseif ($user->role === 'driver') {
            $driver = Driver::where('mobile', $user->mobile)->first();
            if ($driver) {
                $query->whereHas('booking', function ($q) use ($driver) {
                    $q->where('driver_id', $driver->id);
                });
            } else {
                $query->where('id', null);
            }
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        // Support status filtering
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $invoices = $query->with(['booking.customer', 'booking.organization', 'contract'])->get();

        return response()->json([
            'success' => true,
            'data' => $invoices
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $query = Invoice::where('id', $id);

        if ($user->role === 'customer') {
            $query->whereHas('booking', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } elseif ($user->role === 'driver') {
            $driver = Driver::where('mobile', $user->mobile)->first();
            if ($driver) {
                $query->whereHas('booking', function ($q) use ($driver) {
                    $q->where('driver_id', $driver->id);
                });
            } else {
                $query->where('id', null);
            }
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        $invoice = $query->with(['booking.customer', 'booking.organization', 'payments', 'contract'])->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $invoice
        ]);
    }

    public function payCash(Request $request, $id)
    {
        $user = $request->user();
        $query = Invoice::where('id', $id);

        if ($user->role === 'customer') {
            $query->whereHas('booking', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } elseif ($user->role === 'driver') {
            $driver = Driver::where('mobile', $user->mobile)->first();
            if ($driver) {
                $query->whereHas('booking', function ($q) use ($driver) {
                    $q->where('driver_id', $driver->id);
                });
            } else {
                $query->where('id', null);
            }
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        $invoice = $query->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice is already settled.'
            ], 422);
        }

        if ($invoice->status !== 'payment_pending') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice is not in payment_pending status.'
            ], 422);
        }

        $existing = Payment::where('invoice_id', $invoice->id)
            ->where('payment_method', 'cash')
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Cash payment already initiated and pending verification.',
                'data' => $existing
            ]);
        }

        // Create a PENDING cash payment
        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'operator_id' => $invoice->operator_id,
            'amount' => $invoice->total_amount,
            'payment_method' => 'cash',
            'status' => 'pending',
            'notes' => 'Cash collection requested. Awaiting administrator confirmation.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cash payment initiated. Awaiting confirmation.',
            'data' => $payment
        ]);
    }

    public function payOffline(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'paymentMode' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'transactionId' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $operatorId = $request->user()->operator_id;
        $invoice = Invoice::where('operator_id', $operatorId)->where('id', $id)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice is already settled.'
            ], 422);
        }

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'operator_id' => $operatorId,
            'amount' => $request->amount,
            'payment_method' => strtolower($request->paymentMode),
            'transaction_id' => $request->transactionId,
            'status' => 'success',
            'paid_at' => now(),
            'notes' => $request->notes ?? 'Offline payment logged.',
        ]);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        if ($invoice->booking) {
            $invoice->booking->update(['status' => 'paid']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Offline payment recorded and invoice settled successfully.',
            'data' => $payment
        ]);
    }

    public function payOnline(Request $request, $id)
    {
        $user = $request->user();
        $query = Invoice::where('operator_id', $user->operator_id)->where('id', $id);

        if ($user->role === 'customer') {
            $query->whereHas('booking', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        }

        $invoice = $query->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice is already settled.'
            ], 422);
        }

        // Initialize session through isolated PaymentService class
        $session = $this->paymentService->createPaymentSession($invoice, 'online');

        // Log pending payment row
        Payment::create([
            'invoice_id' => $invoice->id,
            'operator_id' => $user->operator_id,
            'amount' => $invoice->total_amount,
            'payment_method' => 'online',
            'transaction_id' => $session['transaction_id'],
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Online checkout session generated.',
            'paymentUrl' => $session['paymentUrl']
        ]);
    }

    public function paymentsIndex(Request $request)
    {
        $user = $request->user();
        $query = Payment::query();

        if ($user->role === 'customer') {
            $query->whereHas('invoice.booking', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->role === 'manager') {
            $query->whereHas('invoice', function ($q) use ($user) {
                $q->where('organization_id', $user->organization_id);
            });
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        $payments = $query->with(['invoice.booking.customer', 'invoice.booking.organization'])->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    public function confirmCash(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action. Only administrators or accountants can confirm cash payments.'
            ], 403);
        }

        $payment = Payment::where('operator_id', $user->operator_id)
            ->where('id', $id)
            ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found.'
            ], 404);
        }

        if ($payment->payment_method !== 'cash') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid payment method.'
            ], 422);
        }

        if ($payment->status === 'success') {
            return response()->json([
                'success' => false,
                'message' => 'Payment already verified and confirmed.'
            ], 422);
        }

        $invoice = Invoice::where('operator_id', $user->operator_id)
            ->where('id', $payment->invoice_id)
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice already paid.'
            ], 422);
        }

        if ($invoice->status !== 'payment_pending') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice is not in payment_pending status.'
            ], 422);
        }

        // Execute inside DB Transaction
        DB::transaction(function() use ($payment, $invoice) {
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'notes' => 'Cash collection verified and confirmed by administrator.'
            ]);

            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            if ($invoice->booking) {
                $invoice->booking->update(['status' => 'paid']);
            }
        });

        // Send payment success notification
        $this->notificationService->send(
            $invoice->operator_id,
            $invoice->booking ? $invoice->booking->user_id : null,
            'payment_success',
            'email',
            'Payment Successful',
            "Payment verified. Your invoice {$invoice->invoice_number} has been settled.",
            $invoice->booking_id,
            $invoice->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Cash payment verified and invoice settled successfully.',
            'data' => $payment
        ]);
    }

    public function webhook(Request $request)
    {
        $signature = $request->header('X-Payment-Signature');
        $payload = $request->getContent();
        
        $secret = config('services.payment.webhook_secret', 'sandbox-secret-123');
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        $isSandbox = true;
        if ($signature && hash_equals($expectedSignature, $signature)) {
            $isSandbox = false;
        }

        $data = $request->all();
        $transactionId = $data['transaction_id'] ?? null;
        $status = $data['status'] ?? null;

        if (!$transactionId) {
            return response()->json(['success' => false, 'message' => 'Missing transaction ID.'], 400);
        }

        $payment = Payment::where('transaction_id', $transactionId)->first();
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment transaction not found.'], 404);
        }

        if (in_array($payment->status, ['success', 'failed'])) {
            return response()->json([
                'success' => true,
                'message' => 'Webhook already processed. Current status: ' . $payment->status
            ], 200);
        }

        $invoice = Invoice::find($payment->invoice_id);
        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Associated invoice not found.'], 404);
        }

        if ($status === 'success') {
            DB::transaction(function() use ($payment, $invoice, $isSandbox) {
                $payment->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'notes' => 'Online payment completed. Signature verified: ' . ($isSandbox ? 'Sandbox/Mock' : 'True'),
                ]);

                $invoice->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                if ($invoice->booking) {
                    $invoice->booking->update(['status' => 'paid']);
                }
            });

            $this->notificationService->send(
                $invoice->operator_id,
                $invoice->booking ? $invoice->booking->user_id : null,
                'payment_success',
                'email',
                'Payment Successful',
                "Your payment of ₹" . $invoice->total_amount . " for invoice {$invoice->invoice_number} succeeded.",
                $invoice->booking_id,
                $invoice->id
            );
        } else {
            DB::transaction(function() use ($payment) {
                $payment->update([
                    'status' => 'failed',
                    'notes' => 'Online payment gateway reported failure.',
                ]);
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Webhook processed successfully.'
        ], 200);
    }

    public function downloadPdf(Request $request, $id)
    {
        $user = $request->user();
        $query = Invoice::where('id', $id);

        if ($user->role === 'customer') {
            $query->whereHas('booking', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->role === 'manager') {
            $query->where('organization_id', $user->organization_id);
        } else {
            $query->where('operator_id', $user->operator_id);
        }

        $invoice = $query->with(['booking.customer', 'booking.vehicle', 'booking.driver', 'booking.trip', 'operator'])->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        $pdfService = new \App\Services\InvoicePdfService();
        return $pdfService->generatePdf($invoice);
    }

    public function generateMonthly(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'contract_id' => 'required|uuid|exists:contracts,id',
            'billing_period' => 'required|string|regex:/^\d{4}-\d{2}$/'
        ]);

        $contract = Contract::where('operator_id', $user->operator_id)
            ->where('id', $request->contract_id)
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found under operator scope.'
            ], 404);
        }

        try {
            $billingService = resolve(\App\Services\ContractBillingService::class);
            $invoice = $billingService->generateInvoice(
                $contract->operator_id,
                $contract->organization_id,
                $contract->id,
                $request->billing_period
            );

            return response()->json([
                'success' => true,
                'message' => 'Monthly invoice processed successfully.',
                'data' => $invoice
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
