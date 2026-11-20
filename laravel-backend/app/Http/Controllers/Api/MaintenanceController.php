<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRecord;
use App\Models\Vehicle;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index(Request $request)
    {
        $query = MaintenanceRecord::with('vehicle');

        if ($request->vehicle_id) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $records = $query->orderBy('service_date', 'desc')->get();

        // Calculate upcoming maintenance reminders
        $reminders = Vehicle::all()->filter(function ($v) {
            $lastMnt = MaintenanceRecord::where('vehicle_id', $v->_id)
                ->orderBy('service_date', 'desc')
                ->first();
            if (!$lastMnt) return false;

            $kmRem = $lastMnt->next_service_mileage ? ($lastMnt->next_service_mileage - $v->current_odometer) : null;
            return ($kmRem !== null && $kmRem <= 1500);
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'records'   => $records,
                'reminders' => $reminders,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vehicle_id'           => 'required',
            'service_date'         => 'required|date',
            'service_mileage'      => 'required|numeric',
            'service_type'         => 'required|string',
            'description'          => 'required|string',
            'service_provider'     => 'required|string',
            'cost'                 => 'required|numeric|min:0',
            'spare_parts_used'     => 'nullable|string',
            'invoice_number'       => 'nullable|string',
            'next_service_date'    => 'nullable|date',
            'next_service_mileage' => 'nullable|numeric',
            'supporting_documents' => 'nullable|string',
        ]);

        $vehicle = Vehicle::findOrFail($request->vehicle_id);

        $count = MaintenanceRecord::count();
        $maintenanceNumber = 'MNT-' . date('Y') . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

        $data = $request->all();
        $data['maintenance_number'] = $maintenanceNumber;
        $data['recorded_by_id'] = $request->user()->_id;
        $data['status'] = 'In Progress';

        $record = MaintenanceRecord::create($data);

        // Update vehicle status
        $vehicle->update(['vehicle_status' => 'Under Maintenance']);

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'CREATE',
            'module'     => 'Maintenance',
            'record_id'  => (string)$record->_id,
            'new_values' => $record->toArray(),
            'reason'     => 'Recorded vehicle maintenance works',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record logged successfully',
            'data'    => $record
        ], 201);
    }
}
