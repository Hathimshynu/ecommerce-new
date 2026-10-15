<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $statusCounts = Order::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'stats' => [
                'orders' => Order::count(),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'revenue' => (float) Order::where('status', 'delivered')->sum('total'),
                'products' => Product::count(),
                'low_stock' => Product::where('stock', '<=', 5)->count(),
                'customers' => User::where('role', User::ROLE_CUSTOMER)->count(),
                'reviews' => Review::count(),
            ],
            'status_counts' => $statusCounts,
            'recent_orders' => Order::with('items')->latest()->limit(8)->get(),
        ]);
    }
}
