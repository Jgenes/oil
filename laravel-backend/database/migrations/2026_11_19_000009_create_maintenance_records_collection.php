<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('maintenance_records', function (Blueprint $collection) {
            $collection->index('maintenance_number', null, null, ['unique' => true]);
            $collection->index('vehicle_id');
            $collection->index('service_date');
            $collection->index('status');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('maintenance_records');
    }
};
