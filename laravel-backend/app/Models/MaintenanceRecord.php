<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class MaintenanceRecord extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'maintenance_records';

    protected $fillable = [
        'maintenance_number',
        'vehicle_id',
        'service_date',
        'service_mileage',
        'service_type', // 'Routine Minor Service', 'Major Scheduled Service', 'Brake Overhaul', etc.
        'description',
        'spare_parts_used',
        'service_provider', // 'MoCU Central Workshop', 'Toyota Tanzania Moshi'
        'cost',
        'invoice_number',
        'next_service_date',
        'next_service_mileage',
        'supporting_documents', // Job card / garage inspection certificate reference
        'status', // 'Scheduled', 'In Progress', 'Completed', 'Cancelled'
        'recorded_by_id',
    ];

    protected $casts = [
        'service_mileage' => 'float',
        'cost' => 'float',
        'next_service_mileage' => 'float',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by_id');
    }
}
