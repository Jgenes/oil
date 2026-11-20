<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReadOnlyAuditorMiddleware
{
    /**
     * Handle an incoming request.
     * Prevents Internal Auditor from performing state-modifying operations (POST, PUT, PATCH, DELETE)
     * to protect statutory audit independence.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === 'auditor') {
            if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                // Allow notification mark as read
                if (!$request->is('api/notifications*')) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Statutory Independence Violation: Internal Auditor has read-only access and cannot create, modify, or approve institutional records.'
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
