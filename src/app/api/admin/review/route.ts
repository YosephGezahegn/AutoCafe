import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Reviews } from "#utils/database/models/review";
import { authOptions } from "#utils/helper/authHelper";

// GET /api/admin/review - Fetch all reviews for the admin's restaurant
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });

		const url = new URL(req.url);
		const restaurantOverride = url.searchParams.get("restaurant");
		let username = session.username;

		if (session?.role === "superadmin" && restaurantOverride) {
			username = restaurantOverride;
		} else if (session?.role !== "admin" && session?.role !== "superadmin") {
			return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		}

		await connectDB();
		const reviews = await Reviews.find({ restaurantID: username }).sort({ createdAt: -1 }).lean();

		const totalReviews = reviews.length;
		const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
		const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
			star,
			count: reviews.filter((r) => r.rating === star).length,
		}));

		return NextResponse.json({
			status: 200,
			data: {
				reviews,
				stats: {
					totalReviews,
					averageRating: Math.round(averageRating * 10) / 10,
					ratingDistribution,
				},
			},
		});
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ status: 500, message: error?.message || "Internal Server Error" }, { status: 500 });
	}
}

// DELETE /api/admin/review - Delete a specific review
export async function DELETE(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });

		const url = new URL(req.url);
		const restaurantOverride = url.searchParams.get("restaurant");
		let username = session.username;

		if (session?.role === "superadmin" && restaurantOverride) {
			username = restaurantOverride;
		} else if (session?.role !== "admin" && session?.role !== "superadmin") {
			return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		}

		await connectDB();
		const reviewId = url.searchParams.get("id");

		if (!reviewId) return NextResponse.json({ status: 400, message: "Review ID required" }, { status: 400 });

		const review = await Reviews.findOne({ _id: reviewId, restaurantID: username });
		if (!review) return NextResponse.json({ status: 404, message: "Review not found" }, { status: 404 });

		await Reviews.deleteOne({ _id: reviewId });

		return NextResponse.json({ status: 200, message: "Review deleted successfully" });
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ status: 500, message: error?.message || "Internal Server Error" }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";
