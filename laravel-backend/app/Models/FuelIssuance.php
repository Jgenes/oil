<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FuelIssuance extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'fuel_issuances';

    protected $fillable = [
        'issuance_number',
        'fuel_request_id',
        'supplier_id',
        'vehicle_id',
        'driver_id',
        'issued_by_id',
        'fuel_type',
        'quantity_approved',
        'quantity_issued',
        'quantity_variance',
        'unit_price',
        'total_cost',
        'receipt_number',
        'invoice_reference',
        'issuance_date',
        'issuance_odometer',
        'notes',
    ];

    protected $casts = [
        'quantity_approved' => 'float',
        'quantity_issued' => 'float',
        'quantity_variance' => 'float',
        'unit_price' => 'float',
        'total_cost' => 'float',
        'issuance_odometer' => 'float',
    ];

    public function fuelRequest()
    {
        return $this->belongsTo(FuelRequest::class, 'fuel_request_id');
    }

    public function supplier()
    {
        return $this->belongsTo(FuelSupplier::class, 'supplier_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by_id');
    }
}
