<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('vehicles', function (Blueprint $collection) {
            $collection->index('registration_number', null, null, ['unique' => true]);
            $collection->index('assigned_department_id');
            $collection->index('vehicle_status');
            $collection->index('category');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('vehicles');
    }
};
