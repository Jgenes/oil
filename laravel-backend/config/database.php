<?php

return [

    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [

        'mongodb' => [
            'driver'   => 'mongodb',
            'dsn'      => env('MONGODB_URI'),
            'database' => env('MONGODB_DATABASE', 'mocu_fleet'),
            'options'  => [
                'appname' => 'MoCU_Fleet_Management',
                'serverSelectionTimeoutMS' => 5000,
            ],
        ],

    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

];
