<?php

namespace App\Support;

use App\Models\Order;
use App\Models\Setting;

class WhatsApp
{
    public static function number(): string
    {
        return preg_replace('/\D+/', '', (string) Setting::get('whatsapp_number'));
    }

    public static function orderMessage(Order $order): string
    {
        $order->loadMissing('items');
        $rupee = fn ($v) => '₹'.number_format((float) $v, 2);

        $lines = [];
        $lines[] = '🛒 *New Order – '.Setting::get('store_name').'*';
        $lines[] = '*Order ID:* '.$order->order_number;
        $lines[] = '*Date:* '.$order->created_at?->format('d M Y, h:i A');
        $lines[] = '';
        $lines[] = '*Products*';
        foreach ($order->items as $i => $item) {
            $lines[] = ($i + 1).'. '.$item->product_name;
            $lines[] = '    Qty: '.$item->quantity.' × '.$rupee($item->price).' = '.$rupee($item->line_total);
        }
        $lines[] = '';
        $lines[] = '*Subtotal:* '.$rupee($order->subtotal);
        $lines[] = '*Shipping:* '.($order->shipping > 0 ? $rupee($order->shipping) : 'FREE');
        $lines[] = '*Total Amount:* '.$rupee($order->total);
        $lines[] = '';
        $lines[] = '*Customer Details*';
        $lines[] = 'Name: '.$order->customer_name;
        $lines[] = 'Phone: '.$order->customer_phone;
        if ($order->customer_email) {
            $lines[] = 'Email: '.$order->customer_email;
        }
        $address = $order->address_line.($order->landmark ? ', '.$order->landmark : '');
        $lines[] = 'Address: '.$address.', '.$order->city.', '.$order->state.' - '.$order->pincode;
        if ($order->notes) {
            $lines[] = 'Notes: '.$order->notes;
        }
        $lines[] = '';
        $lines[] = 'Please confirm my order. Thank you!';

        return implode("\n", $lines);
    }

    public static function orderLink(Order $order): string
    {
        return 'https://wa.me/'.self::number().'?text='.rawurlencode(self::orderMessage($order));
    }
}
