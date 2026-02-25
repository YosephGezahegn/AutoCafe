import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Profiles, type TProfile } from "#utils/database/models/profile";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function PUT(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };
		if (session.role !== "admin") throw { status: 403, message: "Admin Required" };

		const body = await req.json();
		const profile = await Profiles.findOne<TProfile>({ restaurantID: session?.username });

		if (!profile) throw { status: 500, message: "Profile not found" };

		if ("requireCustomerLogin" in body) {
			profile.requireCustomerLogin = body.requireCustomerLogin;
		}

		await profile.save();

		return NextResponse.json({ status: 200, message: "Profile updated successfully" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
