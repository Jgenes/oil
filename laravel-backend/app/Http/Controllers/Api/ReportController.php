<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelIssuance;
use App\Models\FuelRequest;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Department;
use App\Models\MaintenanceRecord;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * 1. Daily Fuel Issuance Report
     */
    public function dailyIssuance(Request $request)
    {
        $date = $request->input('date', date('Y-m-d'));
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $deptId = $request->input('department_id');
        $vehicleId = $request->input('vehicle_id');
        $driverId = $request->input('driver_id');
        $fuelType = $request->input('fuel_type');

        $query = FuelIssuance::with(['vehicle', 'driver', 'supplier', 'fuelRequest.department']);

        if ($startDate && $endDate) {
            $query->whereBetween('issuance_date', [$startDate, $endDate]);
        } else {
            $query->where('issuance_date', 'like', "$date%");
        }

        if ($vehicleId) $query->where('vehicle_id', $vehicleId);
        if ($driverId) $query->where('driver_id', $driverId);
        if ($fuelType) $query->where('fuel_type', $fuelType);

        $issuances = $query->orderBy('issuance_date', 'desc')->get();

        // Scope by department if required
        if ($deptId) {
            $issuances = $issuances->filter(function ($i) use ($deptId) {
                return (string)($i->fuelRequest->department_id ?? '') === (string)$deptId;
            })->values();
        }

        $totalLitres = $issuances->sum('quantity_issued');
        $totalCost = $issuances->sum('total_cost');

        return response()->json([
            'success' => true,
            'summary' => [
                'total_issuances'  => $issuances->count(),
                'total_litres'     => $totalLitres,
                'total_amount_tzs' => $totalCost,
            ],
            'data' => $issuances
        ]);
    }

    /**
     * 2. Monthly Fuel Consumption Report
     */
    public function monthlyConsumption(Request $request)
    {
        $month = $request->input('month', date('Y-m'));
        $deptId = $request->input('department_id');

        $vehicles = Vehicle::with(['department', 'trips' => function ($q) use ($month) {
            $q->where('status', 'Completed')
              ->where('departure_datetime', 'like', "$month%");
        }])->get();

        if ($deptId) {
            $vehicles = $vehicles->where('assigned_department_id', $deptId);
        }

        $records = $vehicles->map(function ($v) {
            $completedTrips = $v->trips;
            $dist = $completedTrips->sum('total_distance_km');
            $fuel = $completedTrips->sum('fuel_consumed_litres');
            $kml = $fuel > 0 ? round($dist / $fuel, 2) : 0;
            return [
                'registration_number'  => $v->registration_number,
                'make'                 => $v->make,
                'model'                => $v->model,
                'category'             => $v->category,
                'fuel_type'            => $v->fuel_type,
                'department_name'      => $v->department->name ?? 'Unassigned',
                'trips_count'          => $completedTrips->count(),
                'total_distance_km'    => $dist,
                'fuel_consumed_litres' => $fuel,
                'avg_km_l'             => $kml,
                'estimated_cost_tzs'   => $completedTrips->sum(fn($t) => $t->fuel_cost_per_km * $t->total_distance_km),
            ];
        });

        return response()->json([
            'success' => true,
            'month'   => $month,
            'data'    => $records->sortByDesc('total_distance_km')->values()
        ]);
    }

    /**
     * 3. Annual Fleet Fuel Expenditure Report
     */
    public function annualExpenditure(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $issuances = FuelIssuance::where('issuance_date', 'like', "$year%")->get();

        $byMonth = [];
        for ($m = 1; $m <= 12; $m++) {
            $mStr = str_pad($m, 2, '0', STR_PAD_LEFT);
            $monthIssuances = $issuances->filter(fn($i) => substr($i->issuance_date, 5, 2) === $mStr);
            $byMonth[] = [
                'month_num'          => $mStr,
                'transactions_count' => $monthIssuances->count(),
                'total_litres'       => $monthIssuances->sum('quantity_issued'),
                'total_cost_tzs'     => $monthIssuances->sum('total_cost'),
                'avg_unit_price'     => $monthIssuances->avg('unit_price') ?? 0,
            ];
        }

        return response()->json([
            'success' => true,
            'year'    => $year,
            'data'    => $byMonth
        ]);
    }

    /**
     * 4. Vehicle Distance Coverage Report
     */
    public function vehicleDistance(Request $request)
    {
        $vehicles = Vehicle::with(['department', 'trips' => fn($q) => $q->where('status', 'Completed')])->get();
        $records = $vehicles->map(function ($v) {
            $dist = $v->trips->sum('total_distance_km');
            $fuel = $v->trips->sum('fuel_consumed_litres');
            return [
                'registration_number' => $v->registration_number,
                'make'                => $v->make,
                'model'               => $v->model,
                'category'            => $v->category,
                'department_name'     => $v->department->name ?? 'Unassigned',
                'current_odometer'    => $v->current_odometer,
                'trips_count'         => $v->trips->count(),
                'total_km_covered'    => $dist,
                'fuel_consumed'       => $fuel,
                'efficiency_km_l'     => $fuel > 0 ? round($dist / $fuel, 2) : 0,
            ];
        });

        return response()->json(['success' => true, 'data' => $records]);
    }

    /**
     * 5. Driver Trips & Fuel Efficiency Report
     */
    public function driverTrips(Request $request)
    {
        $drivers = Driver::with(['assignedVehicle', 'trips' => fn($q) => $q->where('status', 'Completed')])->get();
        $records = $drivers->map(function ($d) {
            $dist = $d->trips->sum('total_distance_km');
            $fuel = $d->trips->sum('fuel_consumed_litres');
            return [
                'full_name'              => $d->full_name,
                'employee_number'        => $d->employee_number,
                'driving_licence_number' => $d->driving_licence_number,
                'assigned_vehicle'       => $d->assignedVehicle->registration_number ?? 'Unassigned',
                'trips_count'            => $d->trips->count(),
                'total_distance_km'      => $dist,
                'total_fuel_consumed'    => $fuel,
                'avg_km_l'               => $fuel > 0 ? round($dist / $fuel, 2) : 0,
                'anomalies_count'        => $d->trips->where('is_anomaly', true)->count(),
            ];
        });

        return response()->json(['success' => true, 'data' => $records]);
    }

    /**
     * 6. Department Utilization & Ceilings Report
     */
    public function departmentUtilization(Request $request)
    {
        $departments = Department::with(['vehicles', 'fuelRequests.fuelIssuance', 'trips'])->get();
        $records = $departments->map(function ($dept) {
            $spent = $dept->fuelRequests->sum(fn($fr) => $fr->fuelIssuance->total_cost ?? 0);
            $budget = $dept->annual_fuel_budget > 0 ? $dept->annual_fuel_budget : 1;
            return [
                'name'               => $dept->name,
                'code'               => $dept->code,
                'annual_fuel_budget' => $dept->annual_fuel_budget,
                'total_spent'        => $spent,
                'utilization_pct'    => round(($spent / $budget) * 100, 1),
                'vehicles_count'     => $dept->vehicles->count(),
                'trips_count'        => $dept->trips->where('status', 'Completed')->count(),
                'total_distance_km'  => $dept->trips->where('status', 'Completed')->sum('total_distance_km'),
            ];
        });

        return response()->json(['success' => true, 'data' => $records]);
    }

    /**
     * 7. Fuel Requests & Approvals Audit Report
     */
    public function requisitionsAudit(Request $request)
    {
        $query = FuelRequest::with(['department', 'vehicle', 'requestedBy']);
        if ($request->status) $query->where('status', $request->status);
        if ($request->fuel_type) $query->where('fuel_type', $request->fuel_type);
        if ($request->vehicle_id) $query->where('vehicle_id', $request->vehicle_id);

        $requests = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * 8. Vehicle Performance & Lifecycle Report
     */
    public function vehiclePerformance(Request $request)
    {
        $vehicles = Vehicle::with(['department', 'trips' => fn($q) => $q->where('status', 'Completed')])->get();
        $data = $vehicles->map(function ($v) {
            $dist = $v->trips->sum('total_distance_km');
            $fuel = $v->trips->sum('fuel_consumed_litres');
            $actualKml = $fuel > 0 ? round($dist / $fuel, 2) : 0;
            return [
                'registration_number'     => $v->registration_number,
                'make'                    => $v->make,
                'model'                   => $v->model,
                'category'                => $v->category,
                'department_name'         => $v->department->name ?? 'Unassigned',
                'current_odometer'        => $v->current_odometer,
                'standard_efficiency_km_l'=> $v->standard_efficiency_km_l,
                'actual_km_l'             => $actualKml,
                'avg_cost_per_km'         => $v->trips->avg('fuel_cost_per_km') ?? 0,
                'anomaly_flags_count'     => $v->trips->where('is_anomaly', true)->count(),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * 9. Fuel Efficiency & Anomaly Report
     */
    public function fuelEfficiency(Request $request)
    {
        $trips = Trip::with(['vehicle', 'driver', 'department'])
            ->where('status', 'Completed')
            ->orderBy('departure_datetime', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $trips]);
    }

    /**
     * 10. Vehicle Maintenance & Garage Cost Report
     */
    public function maintenanceCosts(Request $request)
    {
        $records = MaintenanceRecord::with('vehicle')->orderBy('service_date', 'desc')->get();
        return response()->json(['success' => true, 'data' => $records]);
    }

    /**
     * 11. Supplier Transactions & Invoices Report
     */
    public function supplierTransactions(Request $request)
    {
        $issuances = FuelIssuance::with(['supplier', 'vehicle', 'fuelRequest.department'])
            ->orderBy('issuance_date', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $issuances]);
    }

    /**
     * 12. Department Fuel Budget vs Actual Expenditure
     */
    public function budgetVsActual(Request $request)
    {
        $departments = Department::with('fuelRequests.fuelIssuance')->get();
        $records = $departments->map(function ($d) {
            $spent = $d->fuelRequests->sum(fn($fr) => $fr->fuelIssuance->total_cost ?? 0);
            return [
                'name'                   => $d->name,
                'head_name'              => $d->head_name,
                'annual_fuel_budget'     => $d->annual_fuel_budget,
                'actual_expenditure_tzs' => $spent,
                'remaining_budget_tzs'   => $d->annual_fuel_budget - $spent,
                'utilization_pct'        => round(($spent / ($d->annual_fuel_budget > 0 ? $d->annual_fuel_budget : 1)) * 100, 1),
            ];
        });

        return response()->json(['success' => true, 'data' => $records]);
    }
}
