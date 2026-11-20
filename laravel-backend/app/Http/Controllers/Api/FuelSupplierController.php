<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelSupplier;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class FuelSupplierController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => FuelSupplier::all()
        ]);
    }

    public function updatePrice(Request $request, $id)
    {
        $supplier = FuelSupplier::findOrFail($id);

        $request->validate([
            'current_diesel_price' => 'required|numeric|min:0',
            'current_petrol_price' => 'required|numeric|min:0',
        ]);

        $oldPrices = [
            'diesel' => $supplier->current_diesel_price,
            'petrol' => $supplier->current_petrol_price,
        ];

        $supplier->update([
            'current_diesel_price' => (float)$request->current_diesel_price,
            'current_petrol_price' => (float)$request->current_petrol_price,
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->_id,
            'user_name'  => $request->user()->name,
            'user_role'  => $request->user()->role,
            'action'     => 'UPDATE_FUEL_PRICE',
            'module'     => 'Fuel Suppliers',
            'record_id'  => (string)$supplier->_id,
            'old_values' => $oldPrices,
            'new_values' => ['diesel' => $supplier->current_diesel_price, 'petrol' => $supplier->current_petrol_price],
            'reason'     => 'Updated station pump price tariffs',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fuel station tariff updated successfully',
            'data'    => $supplier
        ]);
    }
}
