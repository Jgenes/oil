<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $departments = Department::with(['vehicles', 'fuelRequests.fuelIssuance', 'trips'])->get();

        $data = $departments->map(function ($d) {
            $spent = $d->fuelRequests->sum(fn($fr) => $fr->fuelIssuance->total_cost ?? 0);
            $budget = $d->annual_fuel_budget > 0 ? $d->annual_fuel_budget : 1;
            $completedTrips = $d->trips->where('status', 'Completed');

            return [
                'id'                     => $d->_id,
                'code'                   => $d->code,
                'name'                   => $d->name,
                'head_name'              => $d->head_name,
                'head_email'             => $d->head_email,
                'annual_fuel_budget'     => $d->annual_fuel_budget,
                'actual_fuel_expenditure'=> $spent,
                'budget_utilization_pct' => round(($spent / $budget) * 100, 1),
                'vehicles_count'         => $d->vehicles->count(),
                'requests_count'         => $d->fuelRequests->count(),
                'trips_count'            => $completedTrips->count(),
                'total_km_driven'        => $completedTrips->sum('total_distance_km'),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data
        ]);
    }

    public function show(Request $request, $id)
    {
        // Confidentiality enforcement: HOD can only see their own department
        $user = $request->user();
        if ($user && $user->role === 'hod' && (string)$user->department_id !== (string)$id) {
            return response()->json([
                'success' => false,
                'error'   => 'Confidentiality Protection: Unauthorized access to other departments records'
            ], 403);
        }

        $department = Department::with([
            'vehicles.driver',
            'fuelRequests' => fn($q) => $q->orderBy('created_at', 'desc')->limit(25),
            'trips'        => fn($q) => $q->orderBy('departure_datetime', 'desc')->limit(25),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $department
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'               => 'required|string|unique:departments,code',
            'name'               => 'required|string|max:255',
            'head_name'          => 'required|string|max:255',
            'annual_fuel_budget' => 'required|numeric|min:0',
        ]);

        $dept = Department::create($request->all());

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'CREATE',
            'module'     => 'Departments',
            'record_id'  => (string)$dept->_id,
            'new_values' => $dept->toArray(),
            'reason'     => 'Created university department and allocated initial fuel vote',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Department registered successfully',
            'data'    => $dept
        ], 201);
    }
}
