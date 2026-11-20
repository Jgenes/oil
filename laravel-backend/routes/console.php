<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('mocu:check-anomalies', function () {
    $this->info('Scanning vehicle trips for abnormal fuel consumption variances...');
})->purpose('Flag trips exceeding baseline consumption by >25%');
