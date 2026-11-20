<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Driver extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'drivers';

    protected $fillable = [
        'full_name',
        'employee_number',
        'phone_number',
        'email',
        'driving_licence_number',
        'licence_classes',
        'licence_expiry_date',
        'assigned_vehicle_id',
        'employment_status', // 'Active', 'On Leave', 'Suspended', 'Retired'
        'notes',
    ];

    public function assignedVehicle()
    {
        return $this->belongsTo(Vehicle::class, 'assigned_vehicle_id');
    }

    public function trips()
    {
        return $this->hasMany(Trip::class, 'driver_id');
    }

    public function fuelRequests()
    {
        return $this->hasMany(FuelRequest::class, 'driver_id');
    }
}
