<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $query = Driver::with('assignedVehicle');

        if ($request->status) {
            $query->where('employment_status', $request->status);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', "%$s%")
                  ->orWhere('employee_number', 'like', "%$s%")
                  ->orWhere('driving_licence_number', 'like', "%$s%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get()
        ]);
    }

    public function show($id)
    {
        $driver = Driver::with(['assignedVehicle', 'trips.vehicle', 'trips.department'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $driver
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'full_name'              => 'required|string|max:255',
            'employee_number'        => 'required|string|unique:drivers,employee_number',
            'phone_number'           => 'required|string',
            'driving_licence_number' => 'required|string|unique:drivers,driving_licence_number',
            'licence_expiry_date'    => 'required|date',
            'licence_classes'        => 'nullable|string',
            'employment_status'      => 'required|string|in:Active,On Leave,Suspended,Retired',
        ]);

        $driver = Driver::create($request->all());

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'CREATE',
            'module'     => 'Drivers',
            'record_id'  => (string)$driver->_id,
            'new_values' => $driver->toArray(),
            'reason'     => 'Registered new driver profile',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver registered successfully',
            'data'    => $driver
        ], 201);
    }
}
