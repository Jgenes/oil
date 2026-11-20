<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\OdometerAdjustment;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = Vehicle::with(['department', 'driver']);

        if ($request->status) {
            $query->where('vehicle_status', $request->status);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get()
        ]);
    }

    public function show($id)
    {
        $vehicle = Vehicle::with([
            'department',
            'driver',
            'trips'              => fn($q) => $q->orderBy('departure_datetime', 'desc')->limit(15),
            'maintenanceRecords' => fn($q) => $q->orderBy('service_date', 'desc')->limit(10),
            'fuelRequests'       => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $vehicle
        ]);
    }

    /**
     * Authorized Odometer Correction Workflow
     */
    public function adjustOdometer(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $request->validate([
            'new_odometer' => 'required|numeric|min:0',
            'reason'       => 'required|string|min:5',
        ]);

        $prev = $vehicle->current_odometer;
        $new = (float)$request->new_odometer;

        $vehicle->update(['current_odometer' => $new]);

        OdometerAdjustment::create([
            'vehicle_id'        => $vehicle->_id,
            'previous_odometer' => $prev,
            'new_odometer'      => $new,
            'reason'            => $request->reason,
            'authorized_by_id'  => $request->user()->_id,
            'ip_address'        => $request->ip(),
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'ODOMETER_ADJUSTMENT',
            'module'     => 'Vehicles',
            'record_id'  => (string)$vehicle->_id,
            'old_values' => ['odometer' => $prev],
            'new_values' => ['odometer' => $new, 'reason' => $request->reason],
            'reason'     => 'Authorized supervisor odometer correction',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Odometer adjusted and logged in audit registry',
            'data'    => $vehicle
        ]);
    }
}
