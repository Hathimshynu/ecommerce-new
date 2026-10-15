<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShopFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Storage::fake('public');
    }

    private function token(string $email, string $password): string
    {
        return $this->postJson('/api/auth/login', compact('email', 'password'))->assertOk()->json('token');
    }

    /** The auth guard caches the resolved user between test requests, so reset it on every switch. */
    private function actingWithToken(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    private function placeOrder(string $token, Product $product, int $qty = 2)
    {
        return $this->actingWithToken($token)->postJson('/api/orders', [
            'customer_name' => 'Ravi Kumar', 'customer_phone' => '9876543210',
            'address_line' => '12 MG Road', 'city' => 'Kochi', 'state' => 'Kerala', 'pincode' => '682001',
            'items' => [['product_id' => $product->id, 'quantity' => $qty]],
        ]);
    }

    public function test_catalog_is_public(): void
    {
        $this->getJson('/api/products')->assertOk()->assertJsonPath('total', 10);
        $slug = Product::first()->slug;
        $this->getJson("/api/products/{$slug}")->assertOk()->assertJsonStructure(['product' => ['images'], 'reviews', 'related']);
    }

    public function test_register_always_creates_customer(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'New', 'email' => 'new@x.com', 'phone' => '9123456789',
            'password' => 'secret12', 'password_confirmation' => 'secret12', 'role' => 'admin',
        ])->assertCreated()->assertJsonPath('user.role', 'customer');
    }

    public function test_order_flow_with_whatsapp_and_manual_status(): void
    {
        $product = Product::first();
        $customer = $this->token('customer@shop.com', 'customer123');

        $res = $this->placeOrder($customer, $product)->assertCreated()
            ->assertJsonPath('message', 'Order placed successfully');
        $order = $res->json('order');

        $this->assertEquals($product->price * 2, $order['subtotal']);
        $this->assertStringStartsWith('https://wa.me/919999999999?text=', $order['whatsapp_url']);
        $text = urldecode(explode('?text=', $order['whatsapp_url'])[1]);
        $this->assertStringContainsString($order['order_number'], $text);
        $this->assertStringContainsString($product->name, $text);
        $this->assertStringContainsString('Ravi Kumar', $text);
        $this->assertSame(48, $product->fresh()->stock);

        $this->actingWithToken($customer)->postJson("/api/orders/{$order['order_number']}/whatsapp-sent")->assertOk();

        // Customers cannot reach the admin panel.
        $this->actingWithToken($customer)->patchJson("/api/admin/orders/{$order['id']}/status", ['status' => 'delivered'])->assertForbidden();

        $staff = $this->token('staff@shop.com', 'staff123');
        $this->actingWithToken($staff)->patchJson("/api/admin/orders/{$order['id']}/status", ['status' => 'dispatched'])
            ->assertOk()->assertJsonPath('status', 'dispatched');
        $this->actingWithToken($staff)->patchJson("/api/admin/orders/{$order['id']}/status", ['status' => 'cancelled'])->assertOk();
        $this->assertSame(50, $product->fresh()->stock);
    }

    public function test_review_requires_purchase_and_accepts_images(): void
    {
        $product = Product::first();
        $customer = $this->token('customer@shop.com', 'customer123');
        $payload = ['product_id' => $product->id, 'rating' => 5, 'comment' => 'Superb quality!',
            'images' => [UploadedFile::fake()->image('a.jpg')]];

        $this->actingWithToken($customer)->post('/api/reviews', $payload, ['Accept' => 'application/json'])->assertStatus(422);

        $this->placeOrder($customer, $product, 1)->assertCreated();
        $this->actingWithToken($customer)->getJson('/api/reviews/reviewable')->assertJsonCount(1);
        $this->actingWithToken($customer)->post('/api/reviews', $payload, ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonCount(1, 'image_urls');
        $this->getJson('/api/reviews')->assertJsonPath('total', 1);
    }

    public function test_staff_can_add_product_with_images_but_not_delete(): void
    {
        $staff = $this->token('staff@shop.com', 'staff123');
        $res = $this->actingWithToken($staff)->post('/api/admin/products', [
            'name' => 'Test Phone', 'price' => 9999, 'mrp' => 12999, 'stock' => 5,
            'description' => '<p>Nice</p>',
            'specifications' => json_encode([['label' => 'RAM', 'value' => '8 GB']]),
            'images' => [UploadedFile::fake()->image('1.jpg'), UploadedFile::fake()->image('2.png')],
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonCount(2, 'images');

        $id = $res->json('id');
        $this->actingWithToken($staff)->deleteJson("/api/admin/products/{$id}")->assertForbidden();
        $admin = $this->token('admin@shop.com', 'admin123');
        $this->actingWithToken($admin)->deleteJson("/api/admin/products/{$id}")->assertOk();
        $this->assertNull(Product::find($id));
    }
}
