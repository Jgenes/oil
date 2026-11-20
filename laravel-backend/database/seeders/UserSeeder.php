<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('mocu@2026');

        $users = [
            [
                'name'            => 'Eng. Godfrey Tarimo',
                'username'        => 'admin',
                'email'           => 'admin@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'admin',
                'department_name' => 'ICT & Systems Directorate',
                'designation'     => 'Chief ICT Administrator',
                'signature_title' => 'Director of ICT & Systems',
                'phone'           => '+255 754 112 233',
                'is_active'       => true,
            ],
            [
                'name'            => 'Capt. Michael Shirima',
                'username'        => 'transport',
                'email'           => 'transport@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'transport_officer',
                'department_name' => 'Transport Section',
                'designation'     => 'Head Transport Officer',
                'signature_title' => 'Head Driver / Transport Officer',
                'phone'           => '+255 784 990 011',
                'is_active'       => true,
            ],
            [
                'name'            => 'Dr. Prosper Mrosso',
                'username'        => 'hod_estate',
                'email'           => 'hod.estate@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'hod',
                'department_name' => 'Estates & Works Department',
                'designation'     => 'Head of Department',
                'signature_title' => 'Sign of Head of Department / Section',
                'phone'           => '+255 713 445 566',
                'is_active'       => true,
            ],
            [
                'name'            => 'Ms. Beatrice Swai',
                'username'        => 'approver_hpmu',
                'email'           => 'hpmu@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'approver_hpmu',
                'department_name' => 'Procurement Management Unit (HPMU)',
                'designation'     => 'Head of Procurement Management Unit',
                'signature_title' => 'Sign of HPMU / Authorizing Officer',
                'phone'           => '+255 768 776 655',
                'is_active'       => true,
            ],
            [
                'name'            => 'CPA Daniel Kimaro',
                'username'        => 'finance',
                'email'           => 'finance@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'finance_officer',
                'department_name' => 'Finance & Accounts Directorate',
                'designation'     => 'Principal University Accountant',
                'signature_title' => 'Finance / Vote Controller',
                'phone'           => '+255 755 332 211',
                'is_active'       => true,
            ],
            [
                'name'            => 'Juma Shabani Mushi',
                'username'        => 'driver1',
                'email'           => 'driver@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'driver',
                'department_name' => 'Transport Section',
                'designation'     => 'Senior University Chauffeur',
                'signature_title' => 'Assigned Driver',
                'phone'           => '+255 712 889 900',
                'is_active'       => true,
            ],
            [
                'name'            => 'CPA Frank Moshi',
                'username'        => 'auditor',
                'email'           => 'auditor@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'auditor',
                'department_name' => 'Internal Audit Directorate',
                'designation'     => 'Chief Internal Auditor',
                'signature_title' => 'Chief Internal Auditor (Read-Only Compliance)',
                'phone'           => '+255 789 223 344',
                'is_active'       => true,
            ],
            [
                'name'            => 'Prof. Alfred S. Sife',
                'username'        => 'management',
                'email'           => 'vc@mocu.ac.tz',
                'password'        => $password,
                'role'            => 'management',
                'department_name' => 'Office of the Vice Chancellor',
                'designation'     => 'Vice Chancellor',
                'signature_title' => 'Vice Chancellor, MoCU',
                'phone'           => '+255 754 000 001',
                'is_active'       => true,
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(['email' => $u['email']], $u);
        }
    }
}
