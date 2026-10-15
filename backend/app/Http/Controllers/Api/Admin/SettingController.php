<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(Setting::allValues());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'store_name' => ['required', 'string', 'max:100'],
            'whatsapp_number' => ['required', 'regex:/^[0-9+\s-]{10,16}$/'],
            'support_email' => ['nullable', 'email'],
            'free_shipping_above' => ['required', 'numeric', 'min:0'],
            'shipping_charge' => ['required', 'numeric', 'min:0'],
            'announcement' => ['nullable', 'string', 'max:255'],
        ]);
        $data['whatsapp_number'] = preg_replace('/\D+/', '', $data['whatsapp_number']);
        Setting::put($data);

        return response()->json(Setting::allValues());
    }
}
