import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import type { TCustomer } from "#utils/database/models/customer";
import type { TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { Reviews } from "#utils/database/models/review";
import { StaffCalls, type TStaffCall } from "#utils/database/models/staffcall";
import { TableSessions } from "#utils/database/models/tablesession";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const restaurantID = session?.username;
		const orders =
			((await Orders.find({ restaurantID })
				.populate<{ customer: TCustomer }>("customer")
				.populate<{ products: { product: TMenu }[] }>("products.product")
				.lean()) as unknown as TOrder[]) ?? [];

		const allStaffCalls = (await StaffCalls.find({ restaurantID }).populate<{ customer: TCustomer }>("customer").lean()) as unknown as TStaffCall[];

		const formattedOrders = orders.map((order) => {
			const orderCreatedAt = new Date(order.createdAt).getTime();
			const relatedCalls = allStaffCalls.filter(
				(call) =>
					call.customer?._id?.toString() === order.customer?._id?.toString() &&
					Math.abs(new Date(call.createdAt).getTime() - orderCreatedAt) < 1000 * 60 * 60 * 12,
			);

			if (order?.products) {
				const products = order.products.map((p) => {
					const product = p as unknown as TProduct;
					const menu = product.product as unknown as TMenu;
					return {
						...product,
						...menu,
						product: menu?._id,
					};
				});
				return { ...order, products: products as unknown as TProduct[] };
			}
			return order;
		});

		const staffCalls = (await StaffCalls.find({ restaurantID, status: "active" }).populate<{ customer: TCustomer }>("customer").lean()) as unknown as TStaffCall[];

		const sessions = await TableSessions.find({ restaurantID }).sort({ updatedAt: -1 }).lean();
		const allReviews = await Reviews.find({ restaurantID }).lean();

		const populatedSessions = sessions.map((session) => {
			const sessionOrders = formattedOrders.filter((o) => o?.sessionId === session.sessionId);
			const sessionCalls = allStaffCalls.filter((c) => c?.sessionId === session.sessionId);
			const sessionReviews = allReviews.filter((r) => r?.sessionId === session.sessionId);
			return {
				...session,
				orders: sessionOrders,
				staffCalls: sessionCalls,
				reviews: sessionReviews,
			};
		});

		return NextResponse.json({ orders: formattedOrders, staffCalls, sessions: populatedSessions });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
