<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

// ---------- Public ----------
Route::get('/settings', [CatalogController::class, 'settings']);
Route::get('/categories', [CatalogController::class, 'categories']);
Route::get('/products', [CatalogController::class, 'products']);
Route::get('/products/{slug}', [CatalogController::class, 'product']);
Route::get('/sitemap', [CatalogController::class, 'sitemap']);
Route::get('/reviews', [ReviewController::class, 'index']);

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// ---------- Any logged-in user ----------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
    Route::post('/orders/{orderNumber}/whatsapp-sent', [OrderController::class, 'markWhatsappSent']);

    Route::get('/reviews/reviewable', [ReviewController::class, 'reviewable']);
    Route::post('/reviews', [ReviewController::class, 'store']);
});

// ---------- Admin panel (admin + staff) ----------
Route::middleware(['auth:sanctum', 'role:admin,staff'])->prefix('admin')->group(function () {
    Route::get('/dashboard', Admin\DashboardController::class);

    Route::get('/categories', [Admin\CategoryController::class, 'index']);
    Route::post('/categories', [Admin\CategoryController::class, 'store']);
    Route::post('/categories/{category}', [Admin\CategoryController::class, 'update']);

    Route::get('/products', [Admin\ProductController::class, 'index']);
    Route::post('/products', [Admin\ProductController::class, 'store']);
    Route::get('/products/{product}', [Admin\ProductController::class, 'show']);
    Route::post('/products/{product}', [Admin\ProductController::class, 'update']);
    Route::delete('/products/{product}/images/{image}', [Admin\ProductController::class, 'destroyImage']);
    Route::put('/products/{product}/images/order', [Admin\ProductController::class, 'reorderImages']);

    Route::get('/orders', [Admin\OrderController::class, 'index']);
    Route::get('/orders/{order}', [Admin\OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [Admin\OrderController::class, 'updateStatus']);

    Route::get('/reviews', [Admin\ReviewController::class, 'index']);
    Route::patch('/reviews/{review}', [Admin\ReviewController::class, 'update']);

    // Destructive actions and store configuration: admin only.
    Route::middleware('role:admin')->group(function () {
        Route::delete('/categories/{category}', [Admin\CategoryController::class, 'destroy']);
        Route::delete('/products/{product}', [Admin\ProductController::class, 'destroy']);
        Route::delete('/reviews/{review}', [Admin\ReviewController::class, 'destroy']);

        Route::get('/users', [Admin\UserController::class, 'index']);
        Route::post('/users', [Admin\UserController::class, 'store']);
        Route::patch('/users/{user}', [Admin\UserController::class, 'update']);

        Route::get('/settings', [Admin\SettingController::class, 'index']);
        Route::put('/settings', [Admin\SettingController::class, 'update']);
    });
});
