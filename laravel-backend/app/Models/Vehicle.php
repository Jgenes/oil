<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Vehicle extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'vehicles';

    protected $fillable = [
        'registration_number',
        'make',
        'model',
        'year',
        'category', // 'Executive / SUV', 'Operational / Pick-up', 'Passenger / Bus', 'Utility / Van'
        'engine_capacity',
        'fuel_type', // 'Diesel', 'Petrol'
        'tank_capacity_litres',
        'current_odometer',
        'initial_odometer',
        'standard_efficiency_km_l',
        'vehicle_status', // 'Active', 'On Trip', 'Under Maintenance', 'Decommissioned'
        'assigned_department_id',
        'assigned_driver_id',
        'insurance_expiry_date',
        'inspection_expiry_date',
        'last_service_odometer',
        'last_service_date',
    ];

    protected $casts = [
        'year' => 'integer',
        'tank_capacity_litres' => 'float',
        'current_odometer' => 'float',
        'initial_odometer' => 'float',
        'standard_efficiency_km_l' => 'float',
        'last_service_odometer' => 'float',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'assigned_department_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'assigned_driver_id');
    }

    public function fuelRequests()
    {
        return $this->hasMany(FuelRequest::class, 'vehicle_id');
    }

    public function trips()
    {
        return $this->hasMany(Trip::class, 'vehicle_id');
    }

    public function maintenanceRecords()
    {
        return $this->hasMany(MaintenanceRecord::class, 'vehicle_id');
    }
}
