<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelRequest;
use App\Models\Vehicle;
use App\Models\Department;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class FuelRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = FuelRequest::with(['vehicle', 'department', 'driver', 'requestedBy']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('created_at', 'desc')->get()
        ]);
    }

    public function show($id)
    {
        $request = FuelRequest::with(['vehicle', 'department', 'driver', 'requestedBy', 'fuelIssuance', 'trip'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $request
        ]);
    }

    /**
     * Digital replica data for MoCU Fuel Requisition Form (Form No. 3143)
     */
    public function getSlipData($id)
    {
        $req = FuelRequest::with(['vehicle', 'department', 'driver', 'requestedBy', 'fuelIssuance'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'slip'    => [
                'form_title'              => 'FUEL REQUISITION FORM',
                'form_number'             => $req->form_serial_number ?? 3143,
                'institution'             => 'MOSHI CO-OPERATIVE UNIVERSITY (MoCU)',
                'address'                 => '06 Sokoine Road, 25121 Mfumuni, P.O. Box 474, Moshi, Tanzania',
                'requisition_officer'     => $req->requested_by_name ?? 'Requisition Officer',
                'department_section'      => $req->department->name ?? 'Estates & Works Department',
                'fuel_type'               => $req->fuel_type,
                'purpose_of_journey'      => $req->purpose_of_journey,
                'destination'             => $req->destination,
                'last_request_kilometer'  => $req->last_request_odometer,
                'present_request_kilometer'=> $req->present_request_odometer,
                'vehicle_number'          => $req->vehicle->registration_number ?? 'DFPA 2045',
                'quantity_litres'         => $req->requested_quantity_litres,
                'unit_price'              => $req->unit_price_estimate,
                'total_value_tzs'         => $req->estimated_fuel_cost,
                'hod_endorsement'         => [
                    'recommended' => $req->hod_recommendation === 'Recommended',
                    'date'        => $req->hod_recommended_at,
                    'comments'    => $req->hod_comments,
                ],
                'transport_verification'  => [
                    'verified' => $req->transport_verification === 'Verified',
                    'odometer' => $req->transport_verified_odometer,
                    'date'     => $req->transport_verified_at,
                    'comments' => $req->transport_comments,
                ],
                'hpmu_authorization'      => [
                    'authorized'  => $req->hpmu_authorization === 'Authorized',
                    'declaration' => $req->hpmu_declaration ?? 'I authorize the above mentioned fuel to be supplied',
                    'quantity'    => $req->hpmu_approved_quantity_litres,
                    'date'        => $req->hpmu_authorized_at,
                    'comments'    => $req->hpmu_comments,
                ],
                'finance_vote'            => [
                    'code'   => $req->finance_vote_code,
                    'amount' => $req->finance_amount_allocated,
                    'date'   => $req->finance_recorded_at,
                ],
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vehicle_id'                => 'required',
            'department_id'             => 'required',
            'fuel_type'                 => 'required|in:Diesel,Petrol',
            'requested_quantity_litres' => 'required|numeric|min:1',
            'purpose_of_journey'        => 'required|string',
            'destination'               => 'required|string',
            'present_request_odometer'  => 'required|numeric',
        ]);

        $vehicle = Vehicle::findOrFail($request->vehicle_id);

        $count = FuelRequest::count();
        $requestNumber = 'MOCU-FR-' . date('Y') . '-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
        $serialNumber = 3143 + $count;

        $unitPrice = $request->fuel_type === 'Diesel' ? 3280 : 3240;
        $totalCost = $request->requested_quantity_litres * $unitPrice;

        $fuelRequest = FuelRequest::create([
            'request_number'            => $requestNumber,
            'form_serial_number'        => $serialNumber,
            'department_id'             => $request->department_id,
            'vehicle_id'                => $request->vehicle_id,
            'driver_id'                 => $request->driver_id ?? $vehicle->assigned_driver_id,
            'requested_by_id'           => $request->user()->_id,
            'requested_by_name'         => $request->user()->name,
            'purpose_of_journey'        => $request->purpose_of_journey,
            'destination'               => $request->destination,
            'fuel_type'                 => $request->fuel_type,
            'last_request_odometer'     => $vehicle->current_odometer,
            'present_request_odometer'  => $request->present_request_odometer,
            'requested_quantity_litres' => (float)$request->requested_quantity_litres,
            'unit_price_estimate'       => $unitPrice,
            'estimated_fuel_cost'       => $totalCost,
            'status'                    => 'pending',
            'stage'                     => 'hod_review',
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'SUBMIT_REQUISITION',
            'module'     => 'Fuel Requests',
            'record_id'  => (string)$fuelRequest->_id,
            'new_values' => $fuelRequest->toArray(),
            'reason'     => "Submitted Fuel Requisition Form No. {$serialNumber}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fuel requisition submitted successfully',
            'data'    => $fuelRequest
        ], 201);
    }
}
