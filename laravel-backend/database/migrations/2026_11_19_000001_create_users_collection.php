<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('users', function (Blueprint $collection) {
            $collection->index('email', null, null, ['unique' => true]);
            $collection->index('username', null, null, ['unique' => true]);
            $collection->index('role');
            $collection->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('users');
    }
};
