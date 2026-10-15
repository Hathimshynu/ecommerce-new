<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        return Review::with(['user:id,name,email', 'product:id,name,slug'])->latest()->paginate(20);
    }

    public function update(Request $request, Review $review)
    {
        $review->update($request->validate(['is_approved' => ['required', 'boolean']]));

        return response()->json($review);
    }

    public function destroy(Review $review)
    {
        foreach ($review->images ?? [] as $path) {
            Media::delete($path);
        }
        $review->delete();

        return response()->json(['message' => 'Review deleted']);
    }
}
