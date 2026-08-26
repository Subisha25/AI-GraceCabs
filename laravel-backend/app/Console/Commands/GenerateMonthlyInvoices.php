<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Contract;
use App\Services\ContractBillingService;
use Carbon\Carbon;

class GenerateMonthlyInvoices extends Command
{
    protected $signature = 'contracts:generate-monthly-invoices {--month= : Billing period in YYYY-MM format}';
    protected $description = 'Automatically generate monthly invoices for all active organization transport contracts.';

    protected ContractBillingService $billingService;

    public function __construct(ContractBillingService $billingService)
    {
        parent::__construct();
        $this->billingService = $billingService;
    }

    public function handle()
    {
        // Default to previous month if not specified (standard invoicing cycle)
        $billingPeriod = $this->option('month') ?: Carbon::now()->subMonth()->format('Y-m');

        $this->info("Starting contract invoice generation for period: {$billingPeriod}...");

        $contracts = Contract::whereIn('status', ['active', 'ACTIVE'])->get();

        if ($contracts->isEmpty()) {
            $this->info("No active contracts found.");
            return 0;
        }

        $successCount = 0;
        $failCount = 0;

        foreach ($contracts as $contract) {
            try {
                $invoice = $this->billingService->generateInvoice(
                    $contract->operator_id,
                    $contract->organization_id,
                    $contract->id,
                    $billingPeriod
                );

                $this->line("✔ Invoice {$invoice->invoice_number} generated for Contract: {$contract->contract_name} (Org: {$contract->organization->name})");
                $successCount++;
            } catch (\Exception $e) {
                $this->error("✘ Failed generating invoice for Contract ID: {$contract->id}. Error: " . $e->getMessage());
                $failCount++;
            }
        }

        $this->info("Completed. Success: {$successCount}, Failed: {$failCount}.");
        return 0;
    }
}
