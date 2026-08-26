<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 10px;
            font-size: 13px;
            line-height: 1.5;
        }
        .invoice-box {
            max-width: 800px;
            margin: auto;
        }
        table {
            width: 100%;
            line-height: inherit;
            text-align: left;
            border-collapse: collapse;
        }
        table td {
            padding: 6px;
            vertical-align: top;
        }
        .header-table td {
            padding-bottom: 20px;
        }
        .title {
            font-size: 28px;
            line-height: 35px;
            color: #1e3a8a;
            font-weight: bold;
            text-transform: uppercase;
        }
        .info-table {
            margin-bottom: 20px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 10px;
        }
        .info-title {
            font-weight: bold;
            color: #4b5563;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 5px;
        }
        .details-table {
            width: 100%;
            margin-bottom: 25px;
        }
        .details-table th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 8px;
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
        }
        .details-table td {
            padding: 8px;
            border-bottom: 1px solid #f3f4f6;
        }
        .totals-table {
            width: 300px;
            float: right;
            margin-bottom: 30px;
        }
        .totals-table td {
            padding: 6px;
        }
        .totals-table tr.total-row td {
            font-weight: bold;
            font-size: 15px;
            color: #1e3a8a;
            border-top: 2px solid #1e3a8a;
        }
        .footer {
            clear: both;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            margin-top: 50px;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge-paid {
            background-color: #d1fae5;
            color: #065f46;
        }
        .badge-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .badge-cancelled {
            background-color: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="invoice-box">
        <!-- Header -->
        <table class="header-table">
            <tr>
                <td>
                    <div class="title">INVOICE</div>
                    <span style="color:#6b7280;">Number:</span> <strong>{{ $invoice->invoice_number }}</strong><br>
                    <span style="color:#6b7280;">Issued:</span> <strong>{{ date('d-m-Y', strtotime($invoice->issued_at)) }}</strong>
                </td>
                <td style="text-align: right;">
                    <span style="font-size: 16px; font-weight: bold; color: #1e3a8a;">{{ $invoice->operator->name }}</span><br>
                    {{ $invoice->operator->address }}<br>
                    Phone: {{ $invoice->operator->phone }}<br>
                    Email: {{ $invoice->operator->email }}
                </td>
            </tr>
        </table>

        <!-- Client & Trip Meta -->
        <table class="info-table">
            <tr>
                <td style="width: 50%;">
                    <div class="info-title">Bill To</div>
                    <strong>{{ $invoice->booking->customer->name }}</strong><br>
                    Mobile: {{ $invoice->booking->customer->mobile }}<br>
                    Email: {{ $invoice->booking->customer->email }}
                </td>
                <td style="width: 50%;">
                    <div class="info-title">Trip Metadata</div>
                    <strong>Booking Ref:</strong> {{ $invoice->booking->booking_code }}<br>
                    <strong>Date & Time:</strong> {{ date('d-m-Y', strtotime($invoice->booking->booking_date)) }} at {{ $invoice->booking->booking_time }}<br>
                    <strong>Vehicle:</strong> {{ $invoice->booking->vehicle->vehicle_name }} ({{ $invoice->booking->vehicle->vehicle_number }})<br>
                    <strong>Driver:</strong> {{ $invoice->booking->driver ? $invoice->booking->driver->name : 'N/A' }}
                </td>
            </tr>
        </table>

        <!-- Details -->
        <table class="details-table">
            <thead>
                <tr>
                    <th style="width: 60%;">Description</th>
                    <th style="text-align: right;">Metrics</th>
                    <th style="text-align: right;">Rate</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Cab Rental Charges</strong><br>
                        <span style="font-size:11px; color:#6b7280;">
                            Pickup: {{ $invoice->booking->pickup_location }}<br>
                            Drop: {{ $invoice->booking->drop_location }}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        {{ number_format($invoice->booking->actual_distance_km ?? $invoice->booking->estimated_distance_km, 2) }} KM<br>
                        <span style="font-size:11px; color:#6b7280;">
                            Duration: {{ $invoice->booking->trip && $invoice->booking->trip->duration_seconds ? gmdate('H:i:s', $invoice->booking->trip->duration_seconds) : '—' }}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        ₹{{ number_format($invoice->booking->vehicle->price_per_km, 2) }}/KM
                    </td>
                    <td style="text-align: right; font-weight: bold;">
                        ₹{{ number_format($invoice->subtotal, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Totals -->
        <table class="totals-table">
            <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹{{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
            <tr>
                <td>Tax ({{ config('billing.tax_rate', 18) }}%):</td>
                <td style="text-align: right;">₹{{ number_format($invoice->tax_amount, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Total:</td>
                <td style="text-align: right;">₹{{ number_format($invoice->total_amount, 2) }}</td>
            </tr>
            <tr>
                <td colspan="2" style="text-align: right; padding-top: 15px;">
                    <span class="badge {{ $invoice->status === 'paid' ? 'badge-paid' : ($invoice->status === 'cancelled' ? 'badge-cancelled' : 'badge-pending') }}">
                        Status: {{ $invoice->status }}
                    </span>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for riding with us! For query resolutions, reach out to {{ $invoice->operator->email }}.</p>
            <p style="font-size: 9px; color: #d1d5db; margin-top: 15px;">Powered by SwiftRide Transport Platform</p>
        </div>
    </div>
</body>
</html>
