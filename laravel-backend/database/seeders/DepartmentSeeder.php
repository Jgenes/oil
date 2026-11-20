<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['code' => 'EST', 'name' => 'Estates & Works Department', 'head_name' => 'Dr. Prosper Mrosso', 'head_email' => 'hod.estate@mocu.ac.tz', 'annual_fuel_budget' => 45000000],
            ['code' => 'VC', 'name' => 'Office of the Vice Chancellor', 'head_name' => 'Prof. Alfred S. Sife', 'head_email' => 'vc@mocu.ac.tz', 'annual_fuel_budget' => 60000000],
            ['code' => 'TRP', 'name' => 'Transport Section', 'head_name' => 'Capt. Michael Shirima', 'head_email' => 'transport@mocu.ac.tz', 'annual_fuel_budget' => 80000000],
            ['code' => 'FCCD', 'name' => 'Faculty of Co-operative & Community Dev.', 'head_name' => 'Dr. Neema Mori', 'head_email' => 'fccd@mocu.ac.tz', 'annual_fuel_budget' => 35000000],
            ['code' => 'FBIS', 'name' => 'Faculty of Business & Information Sciences', 'head_name' => 'Dr. Emmanuel Chao', 'head_email' => 'fbis@mocu.ac.tz', 'annual_fuel_budget' => 35000000],
            ['code' => 'DRPS', 'name' => 'Directorate of Research & Postgraduate Studies', 'head_name' => 'Prof. John Safari', 'head_email' => 'drps@mocu.ac.tz', 'annual_fuel_budget' => 40000000],
            ['code' => 'FIN', 'name' => 'Finance & Accounts Directorate', 'head_name' => 'CPA Daniel Kimaro', 'head_email' => 'finance@mocu.ac.tz', 'annual_fuel_budget' => 25000000],
            ['code' => 'HPMU', 'name' => 'Procurement Management Unit', 'head_name' => 'Ms. Beatrice Swai', 'head_email' => 'hpmu@mocu.ac.tz', 'annual_fuel_budget' => 20000000],
            ['code' => 'DOS', 'name' => 'Dean of Students Directorate', 'head_name' => 'Rev. Fr. Method Kilasara', 'head_email' => 'dos@mocu.ac.tz', 'annual_fuel_budget' => 30000000],
            ['code' => 'ICT', 'name' => 'ICT & Systems Directorate', 'head_name' => 'Eng. Godfrey Tarimo', 'head_email' => 'ict@mocu.ac.tz', 'annual_fuel_budget' => 22000000],
        ];

        foreach ($departments as $d) {
            Department::updateOrCreate(['code' => $d['code']], $d);
        }
    }
}
