<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use App\Models\Setting;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function settings()
    {
        $s = Setting::allValues();

        return response()->json([
            'store_name' => $s['store_name'],
            'whatsapp_number' => preg_replace('/\D+/', '', (string) $s['whatsapp_number']),
            'support_email' => $s['support_email'],
            'free_shipping_above' => (float) $s['free_shipping_above'],
            'shipping_charge' => (float) $s['shipping_charge'],
            'announcement' => $s['announcement'],
        ]);
    }

    public function categories()
    {
        return Category::where('is_active', true)
            ->withCount(['products' => fn ($q) => $q->active()])
            ->orderBy('sort_order')->orderBy('name')->get();
    }

    public function products(Request $request)
    {
        $query = Product::active()->with(['images', 'category:id,name,slug'])
            ->withAvg(['reviews' => fn ($q) => $q->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($q) => $q->where('is_approved', true)]);

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }
        if ($category = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->query('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->query('max_price'));
        }

        match ($request->query('sort')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'popular' => $query->orderByDesc('reviews_count'),
            default => $query->latest(),
        };

        return $query->paginate(min((int) $request->query('per_page', 12), 48));
    }

    public function product(string $slug)
    {
        $product = Product::active()->where('slug', $slug)
            ->with(['images', 'category:id,name,slug'])
            ->withAvg(['reviews' => fn ($q) => $q->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($q) => $q->where('is_approved', true)])
            ->firstOrFail();

        $reviews = Review::where('product_id', $product->id)->where('is_approved', true)
            ->with('user:id,name')->latest()->limit(20)->get();

        $related = Product::active()->with('images')
            ->where('id', '!=', $product->id)
            ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
            ->inRandomOrder()->limit(8)->get();

        return response()->json(compact('product', 'reviews', 'related'));
    }

    /** Lightweight list used for sitemap.xml generation. */
    public function sitemap()
    {
        return response()->json([
            'products' => Product::active()->get(['slug', 'updated_at']),
            'categories' => Category::where('is_active', true)->get(['slug', 'updated_at']),
        ]);
    }
}
