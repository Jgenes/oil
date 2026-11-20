<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user');

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->module) {
            $query->where('module', $request->module);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('user_name', 'like', "%$s%")
                  ->orWhere('record_id', 'like', "%$s%")
                  ->orWhere('reason', 'like', "%$s%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('created_at', 'desc')->paginate(50)
        ]);
    }
}
