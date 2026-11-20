<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FuelRequest extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'fuel_requests';

    protected $fillable = [
        'request_number',
        'form_serial_number', // Matches Form No. 3143
        'department_id',
        'vehicle_id',
        'driver_id',
        'requested_by_id',
        'requested_by_name',
        'purpose_of_journey',
        'destination',
        'fuel_type',
        'last_request_odometer',
        'present_request_odometer',
        'requested_quantity_litres',
        'unit_price_estimate',
        'estimated_fuel_cost',
        'status', // 'pending', 'approved', 'rejected', 'issued'
        'stage',  // 'submission', 'hod_review', 'transport_verification', 'hpmu_authorization', 'finance_recording', 'issued'

        // Multi-level approval steps
        'hod_recommended_by_id',
        'hod_recommended_at',
        'hod_recommendation',
        'hod_comments',

        'transport_verified_by_id',
        'transport_verified_at',
        'transport_verification',
        'transport_verified_odometer',
        'transport_comments',

        'hpmu_authorized_by_id',
        'hpmu_authorized_at',
        'hpmu_authorization', // 'Authorized' / 'Not Authorized'
        'hpmu_declaration',   // "I authorize / do not authorize the above mentioned fuel to be supplied"
        'hpmu_approved_quantity_litres',
        'hpmu_comments',

        'finance_recorded_by_id',
        'finance_recorded_at',
        'finance_vote_code',
        'finance_amount_allocated',

        'rejection_reason',
        'rejected_by_id',
        'rejection_stage',
    ];

    protected $casts = [
        'form_serial_number' => 'integer',
        'last_request_odometer' => 'float',
        'present_request_odometer' => 'float',
        'requested_quantity_litres' => 'float',
        'hpmu_approved_quantity_litres' => 'float',
        'unit_price_estimate' => 'float',
        'estimated_fuel_cost' => 'float',
        'finance_amount_allocated' => 'float',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function fuelIssuance()
    {
        return $this->hasOne(FuelIssuance::class, 'fuel_request_id');
    }

    public function trip()
    {
        return $this->hasOne(Trip::class, 'fuel_request_id');
    }
}
