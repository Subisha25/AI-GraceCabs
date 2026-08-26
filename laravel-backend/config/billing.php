<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Billing & Invoicing Configurations
    |--------------------------------------------------------------------------
    |
    | Centralized settings for tax rates and other billing logic.
    |
    */

    'tax_rate' => env('BILLING_TAX_RATE', 18), // Standard tax rate in percentage (e.g. 18 for 18%)

];
