<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'institution' => 'Moshi Co-operative University (MoCU)',
        'application' => 'MoCU Fleet Fuel and Vehicle Management System',
        'api_docs'    => '/api/health',
    ]);
});
