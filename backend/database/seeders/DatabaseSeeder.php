<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@shop.com'], [
            'name' => 'Store Admin', 'phone' => '9999999999', 'role' => User::ROLE_ADMIN,
            'password' => env('ADMIN_PASSWORD', 'admin123'),
        ]);
        User::updateOrCreate(['email' => 'staff@shop.com'], [
            'name' => 'Store Staff', 'phone' => '9888888888', 'role' => User::ROLE_STAFF, 'password' => 'staff123',
        ]);
        User::updateOrCreate(['email' => 'customer@shop.com'], [
            'name' => 'Demo Customer', 'phone' => '9777777777', 'role' => User::ROLE_CUSTOMER, 'password' => 'customer123',
        ]);

        Setting::put(Setting::DEFAULTS);

        $img = fn (string $id) => "https://images.unsplash.com/photo-{$id}?w=900&q=80&auto=format&fit=crop";

        $catalog = [
            'Electronics' => [
                ['Wireless Over-Ear Headphones', 'SoundMax', 2499, 4999, ['1505740420928-5e560c06d30e', '1583394838336-acd977736f90'],
                    [['Connectivity', 'Bluetooth 5.3'], ['Battery', 'Up to 40 hours'], ['Noise Cancellation', 'Active (ANC)'], ['Warranty', '1 Year']]],
                ['Portable Bluetooth Speaker', 'BoomBox', 1799, 2999, ['1608043152269-423dbba4e7e1'],
                    [['Output', '20W'], ['Water Resistance', 'IPX7'], ['Battery', '12 hours']]],
                ['Instant Film Camera', 'SnapPro', 5499, 6999, ['1526170375885-4d8ecf77b99f'],
                    [['Film Type', 'Instant'], ['Flash', 'Auto'], ['Colour', 'Mint']]],
            ],
            'Watches' => [
                ['Classic Minimal Watch', 'Tempo', 1999, 3499, ['1523275335684-37898b6baf30'],
                    [['Dial', '40 mm'], ['Strap', 'Genuine Leather'], ['Water Resistant', '3 ATM']]],
                ['Smart Fitness Watch', 'Pulse', 3299, 5999, ['1546868871-7041f2a55e12'],
                    [['Display', '1.4" AMOLED'], ['Battery', '7 days'], ['Sensors', 'Heart rate, SpO2']]],
            ],
            'Footwear' => [
                ['Running Sneakers – Red', 'Stride', 2299, 3999, ['1542291026-7eec264c27ff'],
                    [['Upper', 'Breathable Mesh'], ['Sole', 'EVA cushioning'], ['Sizes', 'UK 6 – 11']]],
                ['Everyday Canvas Sneakers', 'Stride', 1499, 2499, ['1491553895911-0055eca6402d', '1600185365483-26d7a4cc7519'],
                    [['Upper', 'Canvas'], ['Closure', 'Lace-up']]],
            ],
            'Fashion' => [
                ['Polarised Sunglasses', 'Shade', 899, 1999, ['1572635196237-14b3f281503f'],
                    [['Lens', 'Polarised UV400'], ['Frame', 'Acetate']]],
            ],
            'Beauty' => [
                ['Signature Eau de Parfum', 'Aura', 1299, 2199, ['1541643600914-78b084683601'],
                    [['Volume', '100 ml'], ['Notes', 'Citrus, Musk, Amber']]],
                ['Daily Skincare Kit', 'Glow', 999, 1599, ['1556228578-8c89e6adf883'],
                    [['Includes', 'Cleanser, Toner, Moisturiser'], ['Skin Type', 'All']]],
            ],
        ];

        $sort = 0;
        foreach ($catalog as $categoryName => $products) {
            $category = Category::updateOrCreate(['slug' => Str::slug($categoryName)], [
                'name' => $categoryName, 'sort_order' => $sort++, 'is_active' => true,
                'image' => $img($products[0][4][0]),
            ]);

            foreach ($products as $i => [$name, $brand, $price, $mrp, $images, $specs]) {
                $product = Product::updateOrCreate(['slug' => Str::slug($name)], [
                    'category_id' => $category->id,
                    'name' => $name,
                    'brand' => $brand,
                    'sku' => strtoupper(Str::substr(Str::slug($brand, ''), 0, 4)).'-'.str_pad((string) ($category->id * 100 + $i), 4, '0', STR_PAD_LEFT),
                    'short_description' => "Premium {$name} by {$brand} — crafted for everyday comfort and style.",
                    'description' => "<p>Meet the <strong>{$name}</strong> from {$brand}. Thoughtfully designed with quality materials, it is built to last and looks great every day.</p><ul><li>Premium build quality</li><li>Easy 7-day returns</li><li>Fast doorstep delivery</li></ul>",
                    'specifications' => array_map(fn ($s) => ['label' => $s[0], 'value' => $s[1]], $specs),
                    'price' => $price,
                    'mrp' => $mrp,
                    'stock' => 50,
                    'is_active' => true,
                    'is_featured' => $i === 0,
                    'meta_title' => "Buy {$name} Online at Best Price",
                    'meta_description' => "Shop {$name} by {$brand} at ₹{$price}. Genuine product, fast delivery, easy returns.",
                ]);
                $product->images()->delete();
                foreach ($images as $pos => $id) {
                    $product->images()->create(['path' => $img($id), 'sort_order' => $pos]);
                }
            }
        }
    }
}
