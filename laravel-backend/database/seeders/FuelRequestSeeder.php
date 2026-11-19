<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FuelRequest;
use App\Models\Vehicle;
use App\Models\Department;
use App\Models\User;

class FuelRequestSeeder extends Seeder
{
    public function run(): void
    {
        $vehicle = Vehicle::where('registration_number', 'DFPA 2045')->first();
        $dept = Department::where('code', 'EST')->first();
        $requester = User::where('role', 'hod')->first();

        // Exact Digital Replica of Form No. 3143
        FuelRequest::updateOrCreate(
            ['form_serial_number' => 3143],
            [
                'request_number'                => 'MOCU-FR-2026-003143',
                'form_serial_number'            => 3143,
                'department_id'                 => $dept?->_id,
                'vehicle_id'                    => $vehicle?->_id,
                'requested_by_id'               => $requester?->_id,
                'requested_by_name'             => 'Dr. Prosper Mrosso',
                'purpose_of_journey'            => 'Supervision and technical inspection of Mweka water intake gravity pipeline and campus water treatment plant',
                'destination'                   => 'Mweka Water Intake Station & Kibosho Campus, Moshi Rural',
                'fuel_type'                     => 'Diesel',
                'last_request_odometer'         => 64270,
                'present_request_odometer'      => 64820,
                'requested_quantity_litres'     => 65,
                'unit_price_estimate'           => 3280,
                'estimated_fuel_cost'           => 213200,
                'status'                        => 'issued',
                'stage'                         => 'issued',

                // Multi-stage endorsement records
                'hod_recommendation'            => 'Recommended',
                'hod_recommended_at'            => '2026-11-16 08:45:00',
                'hod_comments'                  => 'Trip confirmed essential for emergency pipeline restoration.',

                'transport_verification'        => 'Verified',
                'transport_verified_at'         => '2026-11-16 09:15:00',
                'transport_verified_odometer'   => 64820,
                'transport_comments'            => 'Vehicle DFPA 2045 roadworthy. Odometer verified.',

                'hpmu_authorization'            => 'Authorized',
                'hpmu_declaration'              => 'I authorize the above mentioned fuel to be supplied',
                'hpmu_approved_quantity_litres' => 65,
                'hpmu_authorized_at'            => '2026-11-16 10:00:00',
                'hpmu_comments'                 => 'Authorized under water maintenance vote.',

                'finance_vote_code'             => 'VOTE-EST-WAT-2026',
                'finance_amount_allocated'      => 213200,
                'finance_recorded_at'           => '2026-11-16 10:30:00',
            ]
        );
    }
}
