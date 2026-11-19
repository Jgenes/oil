<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('personal_access_tokens', function (Blueprint $collection) {
            $collection->index('tokenable_id');
            $collection->index('tokenable_type');
            $collection->index('token', null, null, ['unique' => true]);
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('personal_access_tokens');
    }
};
