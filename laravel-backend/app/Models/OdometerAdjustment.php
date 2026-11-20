<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class OdometerAdjustment extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'odometer_adjustments';

    protected $fillable = [
        'vehicle_id',
        'previous_odometer',
        'new_odometer',
        'reason',
        'authorized_by_id',
        'ip_address',
    ];

    protected $casts = [
        'previous_odometer' => 'float',
        'new_odometer' => 'float',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function authorizedBy()
    {
        return $this->belongsTo(User::class, 'authorized_by_id');
    }
}
