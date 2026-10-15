<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return Order::with(['items', 'user:id,name,email'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->query('search'), function ($q, $s) {
                $q->where(fn ($w) => $w->where('order_number', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%"));
            })
            ->latest()
            ->paginate(20);
    }

    public function show(Order $order)
    {
        return response()->json($order->load(['items', 'user:id,name,email,phone']));
    }

    /** Status is changed manually by the admin after verifying the order on WhatsApp. */
    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $from = $order->status;
            $to = $data['status'];

            // Return stock when an order gets cancelled, take it again if it is revived.
            if ($from !== 'cancelled' && $to === 'cancelled') {
                foreach ($order->items as $item) {
                    $item->product_id && Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                }
            } elseif ($from === 'cancelled' && $to !== 'cancelled') {
                foreach ($order->items as $item) {
                    $item->product_id && Product::whereKey($item->product_id)->decrement('stock', $item->quantity);
                }
            }

            $order->status = $to;
            if (array_key_exists('admin_note', $data)) {
                $order->admin_note = $data['admin_note'];
            }
            if ($to === 'dispatched' && ! $order->dispatched_at) {
                $order->dispatched_at = now();
            }
            if ($to === 'delivered') {
                $order->dispatched_at ??= now();
                $order->delivered_at ??= now();
            }
            $order->save();
        });

        return response()->json($order->fresh(['items', 'user:id,name,email,phone']));
    }
}
