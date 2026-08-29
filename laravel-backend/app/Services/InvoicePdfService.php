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

    /**
     * Renders and saves the Invoice details as a PDF file on the server.
     *
     * @param Invoice $invoice
     * @return string Full path to the saved PDF file
     */
    public function savePdf(Invoice $invoice): string
    {
        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);
        
        $directory = public_path('uploads/invoices');
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }
        
        $fileName = "invoice-{$invoice->invoice_number}.pdf";
        $filePath = "{$directory}/{$fileName}";
        
        $pdf->save($filePath);
        
        return $filePath;
    }
}
