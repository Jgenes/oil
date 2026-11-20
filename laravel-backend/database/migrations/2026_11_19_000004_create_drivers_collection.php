<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('drivers', function (Blueprint $collection) {
            $collection->index('employee_number', null, null, ['unique' => true]);
            $collection->index('driving_licence_number', null, null, ['unique' => true]);
            $collection->index('employment_status');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('drivers');
    }
};
