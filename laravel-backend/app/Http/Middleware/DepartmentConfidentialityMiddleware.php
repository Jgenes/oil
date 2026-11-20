<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DepartmentConfidentialityMiddleware
{
    /**
     * Handle an incoming request.
     * Prevents department-level reports or details from exposing other departments'
     * confidential financial and operational records without executive authorization.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Executive & Logistics oversight roles allowed cross-department inspection
        $executiveRoles = ['admin', 'management', 'auditor', 'transport_officer', 'finance_officer', 'approver_hpmu'];
        if (in_array($user->role, $executiveRoles)) {
            return $next($request);
        }

        // Head of Department (HOD) or Driver scoped to own department
        $requestedDeptId = $request->input('department_id') ?? $request->route('department') ?? $request->route('id');

        if ($requestedDeptId && (string)$requestedDeptId !== (string)$user->department_id) {
            return response()->json([
                'success' => false,
                'error' => 'Confidentiality Protection: You are strictly prohibited from viewing operational and financial records of other university departments.'
            ], 403);
        }

        // Force user's department_id for reports
        if ($user->department_id) {
            $request->merge(['department_id' => $user->department_id]);
        }

        return $next($request);
    }
}
