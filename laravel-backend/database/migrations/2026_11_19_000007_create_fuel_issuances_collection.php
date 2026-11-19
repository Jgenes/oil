<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('fuel_issuances', function (Blueprint $collection) {
            $collection->index('issuance_number', null, null, ['unique' => true]);
            $collection->index('fuel_request_id');
            $collection->index('supplier_id');
            $collection->index('vehicle_id');
            $collection->index('issuance_date');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('fuel_issuances');
    }
};
