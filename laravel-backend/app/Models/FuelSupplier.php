<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FuelSupplier extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'fuel_suppliers';

    protected $fillable = [
        'supplier_name',
        'station_name',
        'location',
        'contact_person',
        'phone',
        'email',
        'current_diesel_price',
        'current_petrol_price',
        'payment_terms',
        'contract_status',
        'notes',
    ];

    protected $casts = [
        'current_diesel_price' => 'float',
        'current_petrol_price' => 'float',
    ];

    public function fuelIssuances()
    {
        return $this->hasMany(FuelIssuance::class, 'supplier_id');
    }
}
