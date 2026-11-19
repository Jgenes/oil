<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Department extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'departments';

    protected $fillable = [
        'code',
        'name',
        'head_name',
        'head_email',
        'annual_fuel_budget',
        'description',
    ];

    protected $casts = [
        'annual_fuel_budget' => 'float',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'assigned_department_id');
    }

    public function fuelRequests()
    {
        return $this->hasMany(FuelRequest::class, 'department_id');
    }

    public function trips()
    {
        return $this->hasMany(Trip::class, 'department_id');
    }
}
