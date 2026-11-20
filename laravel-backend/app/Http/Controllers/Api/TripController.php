<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $query = Trip::with(['vehicle', 'driver', 'department']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->is_anomaly !== null) {
            $query->where('is_anomaly', filter_var($request->is_anomaly, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('departure_datetime', 'desc')->get()
        ]);
    }

    public function complete(Request $request, $id)
    {
        $trip = Trip::with('vehicle')->findOrFail($id);

        $request->validate([
            'ending_odometer'      => 'required|numeric',
            'fuel_consumed_litres' => 'required|numeric|min:0',
            'return_datetime'      => 'nullable|string',
            'driver_notes'         => 'nullable|string',
            'odometer_override'    => 'nullable|boolean',
            'override_reason'      => 'nullable|string',
        ]);

        $startingOdo = (float)$trip->starting_odometer;
        $endingOdo = (float)$request->ending_odometer;

        // Rule 5: Odometer Integrity Validation
        if ($endingOdo < $startingOdo) {
            if (!$request->odometer_override || empty($request->override_reason)) {
                return response()->json([
                    'success' => false,
                    'error'   => "Rule 5 Violation: Ending odometer ({$endingOdo} KM) cannot be lower than starting odometer ({$startingOdo} KM) without authorized supervisor justification."
                ], 400);
            }
        }

        $distance = max(0, $endingOdo - $startingOdo);
        $fuelConsumed = (float)$request->fuel_consumed_litres;
        $fuelAllocated = (float)$trip->fuel_allocated_litres;
        $fuelRemaining = max(0, $fuelAllocated - $fuelConsumed);

        $efficiency = $fuelConsumed > 0 ? round($distance / $fuelConsumed, 2) : 0;
        $baseline = $trip->vehicle->standard_efficiency_km_l ?? 8.0;

        // Anomaly Detection: Check if actual KM/L falls >25% below baseline
        $isAnomaly = false;
        $anomalyReason = null;
        $severity = 'None';
        $anomalyStatus = 'None';

        if ($baseline > 0 && $distance > 20) {
            $deviationPct = (($baseline - $efficiency) / $baseline) * 100;
            if ($deviationPct > 25.0) {
                $isAnomaly = true;
                $anomalyStatus = 'Flagged';
                $severity = $deviationPct > 40 ? 'Severe' : 'Moderate';
                $anomalyReason = "Actual efficiency ({$efficiency} KM/L) deviates {$deviationPct}% below vehicle standard ({$baseline} KM/L).";
            }
        }

        $trip->update([
            'ending_odometer'          => $endingOdo,
            'return_datetime'          => $request->return_datetime ?? now()->toDateTimeString(),
            'total_distance_km'        => $distance,
            'fuel_consumed_litres'     => $fuelConsumed,
            'fuel_remaining_litres'    => $fuelRemaining,
            'fuel_efficiency_km_l'     => $efficiency,
            'status'                   => 'Completed',
            'is_anomaly'               => $isAnomaly,
            'anomaly_reason'           => $anomalyReason,
            'anomaly_severity'         => $severity,
            'anomaly_status'           => $anomalyStatus,
            'odometer_override'        => (bool)$request->odometer_override,
            'odometer_override_reason' => $request->override_reason,
            'driver_notes'             => $request->driver_notes,
            'completed_by_id'          => $request->user()->_id,
        ]);

        // Update vehicle current odometer & status
        $trip->vehicle->update([
            'current_odometer' => $endingOdo,
            'vehicle_status'   => 'Active',
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'COMPLETE_TRIP',
            'module'     => 'Trips',
            'record_id'  => (string)$trip->_id,
            'new_values' => $trip->toArray(),
            'reason'     => 'Completed trip and computed distance & fuel efficiency',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trip marked as completed successfully',
            'data'    => $trip
        ]);
    }
}
