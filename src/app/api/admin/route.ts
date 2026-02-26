import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const url = new URL(req.url);
		const restaurantOverride = url.searchParams.get("restaurant");
		let username = session?.username;

		if (session?.role === "superadmin" && restaurantOverride) {
			username = restaurantOverride;
		} else if (session?.role !== "admin" && session?.role !== "superadmin") {
			throw { status: 403, message: "Admin access required" };
		}

		const account = await Accounts.findOne<TAccount>({ username }).populate("profile").populate("tables").populate("menus").lean();

		if (!account) throw { status: 500, message: "Unable to fetch data" };

		return NextResponse.json({
			profile: account.profile,
			menus: account.menus,
			tables: account.tables,
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
