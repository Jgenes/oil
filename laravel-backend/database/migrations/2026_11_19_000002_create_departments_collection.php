<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('departments', function (Blueprint $collection) {
            $collection->index('code', null, null, ['unique' => true]);
            $collection->index('name');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('departments');
    }
};
