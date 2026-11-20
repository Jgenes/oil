<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\Department;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $estDept = Department::where('code', 'EST')->first();
        $vcDept = Department::where('code', 'VC')->first();
        $trpDept = Department::where('code', 'TRP')->first();

        $vehicles = [
            [
                'registration_number'     => 'DFPA 2045',
                'make'                    => 'Toyota',
                'model'                   => 'Hilux Double Cabin 4WD',
                'year'                    => 2021,
                'category'                => 'Operational / Pick-up',
                'engine_capacity'         => '2.8L GD-6 Turbo Diesel',
                'fuel_type'               => 'Diesel',
                'tank_capacity_litres'    => 80,
                'current_odometer'        => 64820,
                'initial_odometer'        => 58000,
                'standard_efficiency_km_l'=> 8.5,
                'vehicle_status'          => 'Active',
                'assigned_department_id'  => $estDept?->_id,
            ],
            [
                'registration_number'     => 'SM 4123',
                'make'                    => 'Toyota',
                'model'                   => 'Land Cruiser Prado V6',
                'year'                    => 2022,
                'category'                => 'Executive / SUV',
                'engine_capacity'         => '4.0L V6 Petrol',
                'fuel_type'               => 'Petrol',
                'tank_capacity_litres'    => 87,
                'current_odometer'        => 48950,
                'initial_odometer'        => 42000,
                'standard_efficiency_km_l'=> 6.8,
                'vehicle_status'          => 'Active',
                'assigned_department_id'  => $vcDept?->_id,
            ],
            [
                'registration_number'     => 'STK 6140',
                'make'                    => 'Isuzu',
                'model'                   => 'NQR 75L 38-Passenger Bus',
                'year'                    => 2020,
                'category'                => 'Passenger / Bus',
                'engine_capacity'         => '5.2L 4HK1 Diesel',
                'fuel_type'               => 'Diesel',
                'tank_capacity_litres'    => 140,
                'current_odometer'        => 112400,
                'initial_odometer'        => 105000,
                'standard_efficiency_km_l'=> 4.8,
                'vehicle_status'          => 'Active',
                'assigned_department_id'  => $trpDept?->_id,
            ],
        ];

        foreach ($vehicles as $v) {
            Vehicle::updateOrCreate(['registration_number' => $v['registration_number']], $v);
        }
    }
}
