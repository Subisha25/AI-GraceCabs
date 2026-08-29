<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $mailTitle }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }
        .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 24px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #fbbf24;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header p {
            color: #94a3b8;
            margin: 4px 0 0 0;
            font-size: 14px;
        }
        .content {
            padding: 32px 24px;
            color: #334155;
            line-height: 1.6;
        }
        .content h2 {
            margin-top: 0;
            font-size: 20px;
            color: #0f172a;
            font-weight: 600;
            border-bottom: 2px solid #fbbf24;
            padding-bottom: 8px;
        }
        .message-body {
            font-size: 16px;
            color: #475569;
            margin-bottom: 24px;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 4px 0;
            font-size: 13px;
            color: #64748b;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #fef3c7;
            color: #d97706;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>Grace Cabs</h1>
                <p>Premium Transportation & Corporate Mobility</p>
            </div>

            <!-- Content -->
            <div class="content">
                <h2>{{ $mailTitle }}</h2>
                <div class="message-body">
                    {!! nl2br(e($mailMessage)) !!}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Grace Cabs Support Helpline:</strong> <a href="tel:9003241571">9003241571</a></p>
                <p>Email: <a href="mailto:support@gracecabs.com">support@gracecabs.com</a></p>
                <p style="margin-top: 12px; font-size: 11px; color: #94a3b8;">
                    &copy; {{ date('Y') }} Grace Cabs. All rights reserved.<br>
                    Surandai, Tamil Nadu, India.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
