<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\FuelRequest;
use App\Models\FuelIssuance;
use App\Models\Trip;
use App\Models\Department;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        $totalVehicles = Vehicle::count();
        $activeVehicles = Vehicle::where('vehicle_status', 'Active')->count();
        $onTripVehicles = Vehicle::where('vehicle_status', 'On Trip')->count();
        $maintenanceVehicles = Vehicle::where('vehicle_status', 'Under Maintenance')->count();

        $totalRequests = FuelRequest::count();
        $pendingRequests = FuelRequest::where('status', 'pending')->count();
        $approvedRequests = FuelRequest::whereIn('status', ['approved', 'issued'])->count();

        $issuances = FuelIssuance::all();
        $totalFuelAllocated = $issuances->sum('quantity_issued');
        $totalCostTzs = $issuances->sum('total_cost');

        $completedTrips = Trip::where('status', 'Completed')->get();
        $totalFuelConsumed = $completedTrips->sum('fuel_consumed_litres');
        $totalDistance = $completedTrips->sum('total_distance_km');

        $avgKml = $totalFuelConsumed > 0 ? round($totalDistance / $totalFuelConsumed, 2) : 7.95;
        $costPerKm = $totalDistance > 0 ? round($totalCostTzs / $totalDistance, 1) : 443.9;

        $anomaliesCount = Trip::where('is_anomaly', true)->count();

        // Department Budget Utilization
        $deptBudgets = Department::all()->map(function ($d) {
            $spent = FuelRequest::where('department_id', $d->_id)
                ->with('fuelIssuance')
                ->get()
                ->sum(fn($fr) => $fr->fuelIssuance->total_cost ?? 0);
            return [
                'name'               => $d->name,
                'annual_fuel_budget' => $d->annual_fuel_budget,
                'spent'              => $spent,
                'utilization_pct'    => round(($spent / ($d->annual_fuel_budget > 0 ? $d->annual_fuel_budget : 1)) * 100, 1),
            ];
        });

        return response()->json([
            'success' => true,
            'kpis' => [
                'total_vehicles'        => $totalVehicles,
                'active_vehicles'       => $activeVehicles,
                'on_trip_vehicles'      => $onTripVehicles,
                'maintenance_vehicles'  => $maintenanceVehicles,
                'total_fuel_requests'   => $totalRequests,
                'pending_fuel_requests' => $pendingRequests,
                'approved_fuel_requests'=> $approvedRequests,
                'total_fuel_allocated'  => $totalFuelAllocated,
                'total_fuel_consumed'   => $totalFuelConsumed,
                'total_distance_km'     => $totalDistance,
                'total_fuel_cost_tzs'   => $totalCostTzs,
                'fleet_avg_km_l'        => $avgKml,
                'cost_per_km_tzs'       => $costPerKm,
                'anomalies_flagged'     => $anomaliesCount,
            ],
            'department_budgets' => $deptBudgets,
        ]);
    }
}
