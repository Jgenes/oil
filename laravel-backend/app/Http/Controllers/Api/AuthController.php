<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        $login = $request->email;
        $user = User::where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'error'   => 'Invalid university email/username or password'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'error'   => 'Your user account has been deactivated. Please contact ICT Administrator.'
            ], 403);
        }

        // Revoke previous tokens
        $user->tokens()->delete();

        // Create Sanctum personal access token
        $token = $user->createToken('mocu-fleet-auth-token', ['*'], now()->addDays(7))->plainTextToken;

        // Audit login
        AuditLog::create([
            'user_id'    => $user->_id,
            'user_name'  => $user->name,
            'user_role'  => $user->role,
            'action'     => 'LOGIN',
            'module'     => 'Authentication',
            'record_id'  => (string)$user->_id,
            'reason'     => 'Officer logged into MoCU Fleet Management System',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'              => $user->_id,
                'name'            => $user->name,
                'email'           => $user->email,
                'username'        => $user->username,
                'role'            => $user->role,
                'department_id'   => $user->department_id,
                'department_name' => $user->department_name,
                'designation'     => $user->designation,
                'signature_title' => $user->signature_title,
            ]
        ]);
    }

    /**
     * Get currently authenticated user details.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user'    => $request->user(),
        ]);
    }

    /**
     * Revoke tokens and log out user.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();

            AuditLog::create([
                'user_id'    => $user->_id,
                'user_name'  => $user->name,
                'user_role'  => $user->role,
                'action'     => 'LOGOUT',
                'module'     => 'Authentication',
                'record_id'  => (string)$user->_id,
                'reason'     => 'Officer logged out of session',
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
