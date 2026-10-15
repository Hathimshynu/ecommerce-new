<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->orders()->with('items')->latest()->paginate(10);
    }

    public function show(Request $request, string $orderNumber)
    {
        $order = $request->user()->orders()->with('items')
            ->where('order_number', $orderNumber)->firstOrFail();

        return response()->json($order);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'regex:/^[0-9+\s-]{10,15}$/'],
            'customer_email' => ['nullable', 'email', 'max:190'],
            'address_line' => ['required', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'pincode' => ['required', 'regex:/^[0-9]{4,10}$/'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $order = DB::transaction(function () use ($data, $request) {
            $ids = collect($data['items'])->pluck('product_id');
            // Lock rows so concurrent orders cannot oversell stock.
            $products = Product::with('images')->whereIn('id', $ids)->lockForUpdate()->get()->keyBy('id');

            $subtotal = 0;
            $lines = [];
            foreach ($data['items'] as $row) {
                $product = $products[$row['product_id']];
                if (! $product->is_active) {
                    throw ValidationException::withMessages(['items' => "{$product->name} is no longer available."]);
                }
                if ($product->stock < $row['quantity']) {
                    throw ValidationException::withMessages(['items' => "Only {$product->stock} left in stock for {$product->name}."]);
                }
                $lineTotal = round($product->price * $row['quantity'], 2);
                $subtotal += $lineTotal;
                $lines[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_image' => $product->images->first()?->path,
                    'price' => $product->price,
                    'quantity' => $row['quantity'],
                    'line_total' => $lineTotal,
                ];
                $product->decrement('stock', $row['quantity']);
            }

            $freeAbove = (float) Setting::get('free_shipping_above', '0');
            $shipping = ($freeAbove > 0 && $subtotal >= $freeAbove) ? 0 : (float) Setting::get('shipping_charge', '0');

            $order = Order::create([
                ...collect($data)->except('items')->all(),
                'order_number' => Order::generateNumber(),
                'user_id' => $request->user()->id,
                'subtotal' => $subtotal,
                'shipping' => $shipping,
                'total' => $subtotal + $shipping,
                'status' => 'pending',
            ]);
            $order->items()->createMany($lines);

            return $order;
        });

        return response()->json([
            'message' => 'Order placed successfully',
            'order' => $order->load('items'),
        ], 201);
    }

    /** Called when the customer taps the mandatory "Send on WhatsApp" button. */
    public function markWhatsappSent(Request $request, string $orderNumber)
    {
        $order = $request->user()->orders()->where('order_number', $orderNumber)->firstOrFail();
        if (! $order->whatsapp_sent_at) {
            $order->update(['whatsapp_sent_at' => now()]);
        }

        return response()->json(['ok' => true, 'whatsapp_sent_at' => $order->whatsapp_sent_at]);
    }
}
