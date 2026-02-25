import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { Reviews } from "#utils/database/models/review";
import { Tables } from "#utils/database/models/table";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };
		if (session.role !== "superadmin") throw { status: 403, message: "Super Admin Required" };

		const [totalOrders, totalReviews, totalTables, activeTables, reviews] = await Promise.all([
			Orders.countDocuments(),
			Reviews.countDocuments(),
			Tables.countDocuments(),
			Tables.countDocuments({ isActive: true }),
			Reviews.find().sort({ createdAt: -1 }).limit(100).lean(),
		]);

		const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

		// Revenue from completed orders
		const completedOrders = await Orders.find({ state: "complete" }).lean();
		const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.orderTotal || 0), 0);

		// Recent orders for activity
		const recentOrders = await Orders.find().sort({ createdAt: -1 }).limit(10).lean();

		// Orders by state
		const ordersByState = {
			active: await Orders.countDocuments({ state: "active" }),
			complete: await Orders.countDocuments({ state: "complete" }),
			reject: await Orders.countDocuments({ state: "reject" }),
			cancel: await Orders.countDocuments({ state: "cancel" }),
		};

		// Rating distribution
		const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
			star,
			count: reviews.filter((r) => r.rating === star).length,
		}));

		return NextResponse.json({
			status: 200,
			data: {
				totalOrders,
				totalReviews,
				totalTables,
				activeTables,
				avgRating: Math.round(avgRating * 10) / 10,
				totalRevenue: Math.round(totalRevenue * 100) / 100,
				ordersByState,
				ratingDistribution,
				recentOrders: recentOrders.map((o) => ({
					_id: o._id,
					restaurantID: o.restaurantID,
					table: o.table,
					state: o.state,
					orderTotal: o.orderTotal,
					itemCount: o.products?.length || 0,
					createdAt: o.createdAt,
				})),
				recentReviews: reviews.slice(0, 5).map((r) => ({
					_id: r._id,
					restaurantID: r.restaurantID,
					rating: r.rating,
					comment: r.comment,
					createdAt: r.createdAt,
				})),
			},
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
