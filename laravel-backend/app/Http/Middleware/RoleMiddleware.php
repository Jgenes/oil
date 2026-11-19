<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthenticated'
            ], 401);
        }

        // Administrator has global oversight
        if ($user->role === 'admin' || in_array($user->role, $roles)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'error' => 'Unauthorized action. Required roles: ' . implode(', ', $roles) . '. Current role: ' . $user->role
        ], 403);
    }
}
