<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/** Admin-only: manage customers, staff and admins. */
class UserController extends Controller
{
    public function index(Request $request)
    {
        return User::withCount('orders')
            ->when($request->query('role'), fn ($q, $r) => $q->where('role', $r))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")))
            ->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_STAFF, User::ROLE_CUSTOMER])],
            'password' => ['required', Password::min(6)],
        ]);

        return response()->json(User::create($data), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['sometimes', Rule::in([User::ROLE_ADMIN, User::ROLE_STAFF, User::ROLE_CUSTOMER])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['role' => 'You cannot change your own role or status.']);
        }
        $user->update($data);
        if (($data['is_active'] ?? true) === false) {
            $user->tokens()->delete();
        }

        return response()->json($user);
    }
}
