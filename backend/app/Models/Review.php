<?php

namespace App\Models;

use App\Support\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = ['user_id', 'product_id', 'order_id', 'rating', 'title', 'comment', 'images', 'is_approved'];

    protected $casts = ['images' => 'array', 'rating' => 'integer', 'is_approved' => 'boolean'];

    protected $appends = ['image_urls'];

    protected $hidden = ['images'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function getImageUrlsAttribute(): array
    {
        return array_values(array_filter(array_map([Media::class, 'url'], $this->images ?? [])));
    }
}
