<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        return Product::with(['images', 'category:id,name'])
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%")))
            ->when($request->query('category_id'), fn ($q, $c) => $q->where('category_id', $c))
            ->latest()
            ->paginate(15);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['images', 'category']));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $product = Product::create($data);
        $this->storeImages($request, $product);

        return response()->json($product->load('images'), 201);
    }

    /** POST (multipart) so that images can be uploaded during an update. */
    public function update(Request $request, Product $product)
    {
        $data = $this->validated($request, $product->id);
        if ($data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $product->id);
        }
        $product->update($data);
        $this->storeImages($request, $product);

        return response()->json($product->load('images'));
    }

    public function destroy(Product $product)
    {
        foreach ($product->images as $image) {
            Media::delete($image->path);
        }
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    public function destroyImage(Product $product, ProductImage $image)
    {
        abort_unless($image->product_id === $product->id, 404);
        Media::delete($image->path);
        $image->delete();

        return response()->json($product->load('images'));
    }

    /** Body: { "order": [imageId, imageId, ...] } — first image becomes the cover. */
    public function reorderImages(Request $request, Product $product)
    {
        $ids = $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer']])['order'];
        foreach ($ids as $position => $id) {
            $product->images()->where('id', $id)->update(['sort_order' => $position]);
        }

        return response()->json($product->load('images'));
    }

    private function storeImages(Request $request, Product $product): void
    {
        $start = (int) $product->images()->max('sort_order') + 1;
        foreach ($request->file('images', []) as $i => $file) {
            $product->images()->create([
                'path' => Media::store($file, 'products'),
                'sort_order' => $start + $i,
            ]);
        }
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        // Specifications arrive as a JSON string when the form is multipart.
        if (is_string($request->input('specifications'))) {
            $request->merge(['specifications' => json_decode($request->input('specifications'), true) ?: []]);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sku' => ['nullable', 'string', 'max:64', 'unique:products,sku'.($ignoreId ? ','.$ignoreId : '')],
            'brand' => ['nullable', 'string', 'max:100'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'specifications' => ['nullable', 'array', 'max:50'],
            'specifications.*.label' => ['required', 'string', 'max:100'],
            'specifications.*.value' => ['required', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'min:0'],
            'mrp' => ['nullable', 'numeric', 'gte:price'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);
        unset($data['images']);

        return $data;
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $i = 2;
        while (Product::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
