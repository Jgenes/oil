<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('trips', function (Blueprint $collection) {
            $collection->index('trip_number', null, null, ['unique' => true]);
            $collection->index('vehicle_id');
            $collection->index('driver_id');
            $collection->index('department_id');
            $collection->index('status');
            $collection->index('is_anomaly');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('trips');
    }
};
