<?php

namespace App\Models;

use App\Support\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'product_name', 'product_image', 'price', 'quantity', 'line_total'];

    protected $casts = ['price' => 'float', 'line_total' => 'float', 'quantity' => 'integer'];

    protected $appends = ['image_url'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        return Media::url($this->product_image);
    }
}
