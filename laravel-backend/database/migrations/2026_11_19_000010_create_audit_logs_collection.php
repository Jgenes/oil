<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->create('audit_logs', function (Blueprint $collection) {
            $collection->index('user_id');
            $collection->index('action');
            $collection->index('module');
            $collection->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('audit_logs');
    }
};
