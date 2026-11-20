<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Trip extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'trips';

    protected $fillable = [
        'trip_number',
        'fuel_request_id',
        'fuel_issuance_id',
        'vehicle_id',
        'driver_id',
        'department_id',
        'origin',
        'destination',
        'purpose',
        'departure_datetime',
        'return_datetime',
        'starting_odometer',
        'ending_odometer',
        'total_distance_km', // Rule 5: ending - starting
        'fuel_allocated_litres',
        'fuel_issued_litres',
        'fuel_consumed_litres', // Rule 7: separate tracking
        'fuel_remaining_litres',
        'fuel_efficiency_km_l',
        'expected_efficiency_km_l',
        'fuel_cost_per_km',
        'status', // 'In Progress', 'Completed', 'Cancelled'
        'is_anomaly',
        'anomaly_reason',
        'anomaly_severity', // 'None', 'Low', 'Medium', 'High'
        'anomaly_status',   // 'None', 'Flagged', 'Under Investigation', 'Justified', 'Cleared'
        'anomaly_investigated_by_id',
        'anomaly_justification',
        'odometer_override',
        'odometer_override_reason',
        'driver_notes',
        'completed_by_id',
    ];

    protected $casts = [
        'starting_odometer' => 'float',
        'ending_odometer' => 'float',
        'total_distance_km' => 'float',
        'fuel_allocated_litres' => 'float',
        'fuel_issued_litres' => 'float',
        'fuel_consumed_litres' => 'float',
        'fuel_remaining_litres' => 'float',
        'fuel_efficiency_km_l' => 'float',
        'expected_efficiency_km_l' => 'float',
        'fuel_cost_per_km' => 'float',
        'is_anomaly' => 'boolean',
        'odometer_override' => 'boolean',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function fuelRequest()
    {
        return $this->belongsTo(FuelRequest::class, 'fuel_request_id');
    }

    public function fuelIssuance()
    {
        return $this->belongsTo(FuelIssuance::class, 'fuel_issuance_id');
    }
}
