<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    /** Public: latest approved reviews for the home page. */
    public function index(Request $request)
    {
        return Review::where('is_approved', true)
            ->with(['user:id,name', 'product:id,name,slug'])
            ->latest()
            ->paginate(min((int) $request->query('per_page', 12), 30));
    }

    /** Products the logged-in customer has purchased and not reviewed yet. */
    public function reviewable(Request $request)
    {
        $user = $request->user();
        $reviewed = $user->reviews()->pluck('product_id')->filter()->all();

        $items = Order::where('user_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->with('items')
            ->latest()->get()
            ->flatMap(fn ($o) => $o->items->map(fn ($i) => [
                'order_id' => $o->id,
                'order_number' => $o->order_number,
                'product_id' => $i->product_id,
                'product_name' => $i->product_name,
                'image_url' => $i->image_url,
            ]))
            ->filter(fn ($i) => $i['product_id'] && ! in_array($i['product_id'], $reviewed))
            ->unique('product_id')->values();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:120'],
            'comment' => ['required', 'string', 'min:5', 'max:2000'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        $user = $request->user();

        // Only customers who actually ordered the product can review it.
        $order = Order::where('user_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->whereHas('items', fn ($q) => $q->where('product_id', $data['product_id']))
            ->latest()->first();
        if (! $order) {
            throw ValidationException::withMessages(['product_id' => 'You can review only products you have purchased.']);
        }
        if ($user->reviews()->where('product_id', $data['product_id'])->exists()) {
            throw ValidationException::withMessages(['product_id' => 'You have already reviewed this product.']);
        }

        $paths = [];
        foreach ($request->file('images', []) as $file) {
            $paths[] = Media::store($file, 'reviews');
        }

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $data['product_id'],
            'order_id' => $order->id,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'],
            'images' => $paths,
            'is_approved' => true,
        ]);

        return response()->json($review->load(['user:id,name', 'product:id,name,slug']), 201);
    }
}
