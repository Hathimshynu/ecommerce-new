<?php

namespace App\Models;

use App\Support\WhatsApp;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

    protected $fillable = [
        'order_number', 'user_id', 'customer_name', 'customer_phone', 'customer_email',
        'address_line', 'landmark', 'city', 'state', 'pincode', 'notes',
        'subtotal', 'shipping', 'total', 'status', 'whatsapp_sent_at',
        'dispatched_at', 'delivered_at', 'admin_note',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'shipping' => 'float',
        'total' => 'float',
        'whatsapp_sent_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected $appends = ['whatsapp_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** wa.me link pre-filled with this order's products, prices and customer details. */
    public function getWhatsappUrlAttribute(): string
    {
        return WhatsApp::orderLink($this);
    }

    public static function generateNumber(): string
    {
        do {
            $number = 'ORD'.now()->format('ymd').strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
        } while (static::where('order_number', $number)->exists());

        return $number;
    }
}
