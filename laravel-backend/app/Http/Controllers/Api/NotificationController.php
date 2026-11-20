<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->_id)
            ->orWhere('target_role', $user->role)
            ->orWhereNull('target_role')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $notifications
        ]);
    }

    public function markAsRead($id)
    {
        $notif = Notification::findOrFail($id);
        $notif->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }
}
