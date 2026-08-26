<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Models\User;
use App\Models\Otp;
use App\Models\Operator;
use App\Models\Driver;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        // For individual customers, we assign the default Operator ID
        $operator = Operator::first();
        $operatorId = $operator ? $operator->id : (string) Str::uuid();

        $user = User::create([
            'operator_id' => $operatorId,
            'name' => $request->name,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'password' => Hash::make($request->password),
            'role' => 'customer',
            'status' => 'pending', // Pending OTP activation
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer registered successfully. Verify mobile to activate.',
            'data' => $user
        ], 201);
    }

    public function sendOtp(SendOtpRequest $request)
    {
        // Generate random 6-digit OTP
        $otpCode = sprintf('%06d', mt_rand(100000, 999999));
        
        // Store in cache for testing verification
        if (app()->environment('testing')) {
            \Illuminate\Support\Facades\Cache::put('test_otp_' . $request->mobile, $otpCode, 300);
        }

        // Expire older active OTPs for this mobile
        Otp::where('mobile', $request->mobile)
            ->whereNull('verified_at')
            ->update(['expires_at' => now()]);

        $otp = Otp::create([
            'mobile' => $request->mobile,
            'otp' => Hash::make($otpCode),
            'purpose' => $request->purpose,
            'attempts' => 0,
            'expires_at' => now()->addMinutes(5),
        ]);

        // Send OTP via SmsProvider / WhatsApp using NotificationService
        $operator = Operator::first();
        $operatorId = $operator ? $operator->id : (string) Str::uuid();
        
        if (empty(env('TWO_FACTOR_API_KEY')) && !app()->environment('testing')) {
            Log::warning("SmsProvider: TWO_FACTOR_API_KEY is missing in .env. Mocking OTP dispatch in logs.");
            Log::info("SMS Mock (Credentials Missing): To {$request->mobile}. Message: \"Your SwiftRide verification code is: {$otpCode}. It will expire in 5 minutes.\"");
            
            return response()->json([
                'success' => true,
                'message' => 'OTP generated (Mock logged in server logs). SMS provider credentials missing.'
            ]);
        }

        app(NotificationService::class)->send(
            $operatorId,
            null, // No user ID during registration/verification phase
            'otp',
            'sms',
            'SwiftRide OTP Code',
            "Your SwiftRide verification code is: {$otpCode}. It will expire in 5 minutes.",
            null,
            null,
            $request->mobile
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP dispatched successfully.'
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request)
    {
        $otp = Otp::where('mobile', $request->mobile)
            ->where('purpose', $request->purpose)
            ->where('expires_at', '>', now())
            ->whereNull('verified_at')
            ->first();

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.'
            ], 422);
        }

        if ($otp->attempts >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'Too many failed attempts. Please request a new OTP.'
            ], 422);
        }

        // Check password matching
        if (!Hash::check($request->otp, $otp->otp)) {
            $otp->increment('attempts');
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.'
            ], 422);
        }

        $otp->update(['verified_at' => now()]);

        // Find associated user
        $user = User::where('mobile', $request->mobile)->first();

        // If no user record exists, check if they are in the drivers table!
        if (!$user) {
            $driver = Driver::where('mobile', $request->mobile)->first();
            if ($driver) {
                // Automatically create a User record for the driver
                $user = User::create([
                    'operator_id' => $driver->operator_id,
                    'name' => $driver->name,
                    'email' => $driver->email ?? ($driver->mobile . '@cabs.com'),
                    'mobile' => $driver->mobile,
                    'password' => Hash::make(Str::random(16)),
                    'role' => 'driver',
                    'status' => 'active',
                ]);
            }
        }

        if ($request->purpose === 'register' && $user) {
            $user->update([
                'status' => 'active',
                'mobile_verified_at' => now()
            ]);
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User account not found.'
            ], 404);
        }

        // Auto login and return token
        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password credentials.'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active. Verify mobile first.'
            ], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully.',
            'token' => $token,
            'accessToken' => $token,
            'user' => $user,
            'role' => $user->role,
            'id' => $user->id,
            'name' => $user->name,
            'companyId' => $user->organization_id
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'mobile' => 'required|string|max:20',
            'address' => 'nullable|string',
        ]);

        $user->update($request->only('name', 'email', 'mobile', 'address'));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Session terminated successfully.'
        ]);
    }

    public function getCustomers(Request $request)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $users = \App\Models\User::where('operator_id', $operatorId)
            ->where('role', 'customer')
            ->get();

        $formatted = $users->map(function($u) {
            $lastB = \App\Models\Booking::where('user_id', $u->id)
                ->orderBy('created_at', 'desc')
                ->first();
            return [
                'userId' => $u->id,
                'username' => $u->name,
                'email' => $u->email,
                'mobile' => $u->mobile,
                'role' => $u->role,
                'status' => $u->status,
                'companyId' => $u->organization_id,
                'createdAt' => $u->created_at ? $u->created_at->toISOString() : null,
                'totalBookings' => \App\Models\Booking::where('user_id', $u->id)->count(),
                'lastBookingDate' => $lastB ? $lastB->booking_date : null
            ];
        });

        return response()->json($formatted);
    }

    public function showCustomer(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $operatorId = $request->user()->operator_id;
        $customer = \App\Models\User::where('operator_id', $operatorId)
            ->where('id', $id)
            ->where('role', 'customer')
            ->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found.'
            ], 404);
        }

        $bookings = \App\Models\Booking::where('user_id', $customer->id)->get();

        $summary = [
            'total' => $bookings->count(),
            'upcoming' => $bookings->whereIn('status', ['pending', 'accepted', 'confirmed'])->count(),
            'ongoing' => $bookings->where('status', 'started')->count(),
            'completed' => $bookings->where('status', 'completed')->count(),
            'cancelled' => $bookings->where('status', 'cancelled')->count()
        ];

        $recentBookings = \App\Models\Booking::where('user_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'booking_code' => $b->booking_code,
                    'pickup_location' => $b->pickup_location,
                    'drop_location' => $b->drop_location,
                    'booking_date' => $b->booking_date,
                    'booking_time' => $b->booking_time,
                    'status' => $b->status,
                    'estimated_fare' => $b->estimated_fare,
                ];
            });

        return response()->json([
            'success' => true,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'mobile' => $customer->mobile,
                'status' => $customer->status,
                'createdAt' => $customer->created_at ? $customer->created_at->toISOString() : null,
            ],
            'summary' => $summary,
            'recentBookings' => $recentBookings
        ]);
    }

    public function updateCustomerStatus(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'status' => 'required|string|in:active,inactive'
        ]);

        $operatorId = $request->user()->operator_id;
        $customer = \App\Models\User::where('operator_id', $operatorId)
            ->where('id', $id)
            ->where('role', 'customer')
            ->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found.'
            ], 404);
        }

        $customer->update([
            'status' => $request->status
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer status updated successfully.',
            'status' => $customer->status
        ]);
    }

    public function createUser(Request $request)
    {
        if (!in_array($request->user()->role, ['superadmin', 'admin', 'accountant', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action.'
            ], 403);
        }

        $request->validate([
            'username' => 'required|string|max:191',
            'email' => 'required|email|unique:users,email',
            'mobile' => 'required|string|max:20|unique:users,mobile',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'companyId' => 'nullable|string'
        ]);

        $user = $request->user();
        $operatorId = $user->operator_id;
        
        // If manager, auto-set companyId to manager's organization
        $companyId = $request->companyId;
        if ($user->role === 'manager') {
            $companyId = $user->organization_id;
        }

        $newUser = User::create([
            'operator_id' => $operatorId,
            'organization_id' => $companyId,
            'name' => $request->username,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'password' => Hash::make($request->password),
            'role' => $request->role === 'user' ? 'customer' : $request->role,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data' => $newUser
        ], 201);
    }
}
