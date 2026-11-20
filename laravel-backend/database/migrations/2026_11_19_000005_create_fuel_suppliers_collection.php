<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('fuel_suppliers', function (Blueprint $collection) {
            $collection->index('supplier_name');
            $collection->index('contract_status');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('fuel_suppliers');
    }
};
