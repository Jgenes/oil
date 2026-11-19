<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('fuel_requests', function (Blueprint $collection) {
            $collection->index('request_number', null, null, ['unique' => true]);
            $collection->index('form_serial_number');
            $collection->index('department_id');
            $collection->index('vehicle_id');
            $collection->index('status');
            $collection->index('stage');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('fuel_requests');
    }
};
