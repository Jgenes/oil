<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelIssuance;
use App\Models\FuelRequest;
use App\Models\Trip;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class FuelIssuanceController extends Controller
{
    public function index(Request $request)
    {
        $issuances = FuelIssuance::with(['vehicle', 'driver', 'supplier', 'fuelRequest.department'])
            ->orderBy('issuance_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $issuances
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'fuel_request_id'   => 'required',
            'supplier_id'       => 'required',
            'quantity_issued'   => 'required|numeric|min:1',
            'unit_price'        => 'required|numeric',
            'receipt_number'    => 'required|string',
            'issuance_odometer' => 'required|numeric',
        ]);

        $fuelReq = FuelRequest::with('vehicle')->findOrFail($request->fuel_request_id);

        $count = FuelIssuance::count();
        $issuanceNumber = 'FI-' . date('Y') . '-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);

        $approved = (float)($fuelReq->hpmu_approved_quantity_litres ?? $fuelReq->requested_quantity_litres);
        $issued = (float)$request->quantity_issued;
        $variance = $issued - $approved;
        $totalCost = $issued * (float)$request->unit_price;

        $issuance = FuelIssuance::create([
            'issuance_number'   => $issuanceNumber,
            'fuel_request_id'   => $fuelReq->_id,
            'supplier_id'       => $request->supplier_id,
            'vehicle_id'        => $fuelReq->vehicle_id,
            'driver_id'         => $fuelReq->driver_id,
            'issued_by_id'      => $request->user()->_id,
            'fuel_type'         => $fuelReq->fuel_type,
            'quantity_approved' => $approved,
            'quantity_issued'   => $issued,
            'quantity_variance' => $variance,
            'unit_price'        => (float)$request->unit_price,
            'total_cost'        => $totalCost,
            'receipt_number'    => $request->receipt_number,
            'invoice_reference' => $request->invoice_reference,
            'issuance_date'     => now()->toDateTimeString(),
            'issuance_odometer' => (float)$request->issuance_odometer,
            'notes'             => $request->notes,
        ]);

        // Update fuel request status to issued
        $fuelReq->update(['status' => 'issued', 'stage' => 'issued']);

        // Auto stage active trip
        $tripCount = Trip::count();
        $tripNumber = 'TRP-' . date('Y') . '-' . str_pad($tripCount + 1, 4, '0', STR_PAD_LEFT);

        Trip::create([
            'trip_number'           => $tripNumber,
            'fuel_request_id'       => $fuelReq->_id,
            'fuel_issuance_id'      => $issuance->_id,
            'vehicle_id'            => $fuelReq->vehicle_id,
            'driver_id'             => $fuelReq->driver_id,
            'department_id'         => $fuelReq->department_id,
            'origin'                => 'MoCU Main Campus',
            'destination'           => $fuelReq->destination,
            'purpose'               => $fuelReq->purpose_of_journey,
            'departure_datetime'    => now()->toDateTimeString(),
            'starting_odometer'     => (float)$request->issuance_odometer,
            'fuel_allocated_litres' => $approved,
            'fuel_issued_litres'    => $issued,
            'status'                => 'In Progress',
        ]);

        $fuelReq->vehicle->update(['vehicle_status' => 'On Trip']);

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'ISSUE_FUEL',
            'module'     => 'Fuel Issuance',
            'record_id'  => (string)$issuance->_id,
            'new_values' => $issuance->toArray(),
            'reason'     => "Issued {$issued}L fuel at station. Staged trip {$tripNumber}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fuel dispensed and trip initiated',
            'data'    => $issuance
        ], 201);
    }
}
