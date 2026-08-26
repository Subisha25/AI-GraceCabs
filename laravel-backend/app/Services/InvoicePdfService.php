<?php

namespace App\Services;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePdfService
{
    /**
     * Renders and streams the Invoice details as a PDF download.
     */
    public function generatePdf(Invoice $invoice)
    {
        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);
        
        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
