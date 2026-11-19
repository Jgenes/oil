<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\FuelRequestController;
use App\Http\Controllers\Api\FuelIssuanceController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\FuelSupplierController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\NotificationController;

/*
|--------------------------------------------------------------------------
| MoCU Fleet Management System - Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/health', function () {
    return response()->json([
        'status'     => 'online',
        'university' => 'Moshi Co-operative University (MoCU)',
        'system'     => 'Fleet Fuel and Vehicle Management System (Laravel + Sanctum + MongoDB)',
        'timestamp'  => now()->toISOString()
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Sanctum Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'auditor.readonly'])->group(function () {

    // Auth & Profile
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard & KPIs
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

    // Vehicles
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/{id}', [VehicleController::class, 'show']);
    Route::post('/vehicles/{id}/odometer-adjust', [VehicleController::class, 'adjustOdometer'])
        ->middleware('role:transport_officer,admin');

    // Fuel Requests (with digital Form 3143 slip)
    Route::get('/fuel-requests', [FuelRequestController::class, 'index']);
    Route::get('/fuel-requests/{id}', [FuelRequestController::class, 'show']);
    Route::get('/fuel-requests/{id}/slip-data', [FuelRequestController::class, 'getSlipData']);
    Route::post('/fuel-requests', [FuelRequestController::class, 'store']);

    // Fuel Issuances
    Route::get('/fuel-issuances', [FuelIssuanceController::class, 'index']);
    Route::post('/fuel-issuances', [FuelIssuanceController::class, 'store'])
        ->middleware('role:transport_officer,admin');

    // Trips & Consumption
    Route::get('/trips', [TripController::class, 'index']);
    Route::post('/trips/{id}/complete', [TripController::class, 'complete'])
        ->middleware('role:driver,transport_officer,admin');

    // Drivers
    Route::get('/drivers', [DriverController::class, 'index']);
    Route::get('/drivers/{id}', [DriverController::class, 'show']);
    Route::post('/drivers', [DriverController::class, 'store'])
        ->middleware('role:transport_officer,admin');

    // Departments (with confidentiality enforcement)
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/departments/{id}', [DepartmentController::class, 'show'])
        ->middleware('department.confidentiality');
    Route::post('/departments', [DepartmentController::class, 'store'])
        ->middleware('role:admin');

    // Fuel Suppliers & Tariffs
    Route::get('/suppliers', [FuelSupplierController::class, 'index']);
    Route::put('/suppliers/{id}/prices', [FuelSupplierController::class, 'updatePrice'])
        ->middleware('role:transport_officer,admin');

    // Maintenance & Workshop
    Route::get('/maintenance', [MaintenanceController::class, 'index']);
    Route::post('/maintenance', [MaintenanceController::class, 'store'])
        ->middleware('role:transport_officer,admin');

    // Compliance Audit Trail
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // 12 Institutional Reports (with department confidentiality protection)
    Route::prefix('reports')->middleware('department.confidentiality')->group(function () {
        Route::get('/daily-issuance', [ReportController::class, 'dailyIssuance']);
        Route::get('/monthly-consumption', [ReportController::class, 'monthlyConsumption']);
        Route::get('/annual-expenditure', [ReportController::class, 'annualExpenditure']);
        Route::get('/vehicle-distance', [ReportController::class, 'vehicleDistance']);
        Route::get('/driver-trips', [ReportController::class, 'driverTrips']);
        Route::get('/department-utilization', [ReportController::class, 'departmentUtilization']);
        Route::get('/requisitions-audit', [ReportController::class, 'requisitionsAudit']);
        Route::get('/vehicle-performance', [ReportController::class, 'vehiclePerformance']);
        Route::get('/fuel-efficiency', [ReportController::class, 'fuelEfficiency']);
        Route::get('/maintenance-costs', [ReportController::class, 'maintenanceCosts']);
        Route::get('/supplier-transactions', [ReportController::class, 'supplierTransactions']);
        Route::get('/budget-vs-actual', [ReportController::class, 'budgetVsActual']);
    });

});
