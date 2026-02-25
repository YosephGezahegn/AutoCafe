import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Profiles } from "#utils/database/models/profile";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };
		if (session.role !== "superadmin") throw { status: 403, message: "Super Admin Required" };

		const profiles = await Profiles.find().lean();
		const accounts = await Accounts.find({ isSuperAdmin: { $ne: true } }).lean();

		return NextResponse.json({
			status: 200,
			data: { profiles, accounts },
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };
		if (session.role !== "superadmin") throw { status: 403, message: "Super Admin Required" };

		const body = await req.json();
		const { username, email, password, name, description, address } = body;

		if (!username || !email || !password || !name) throw { status: 400, message: "Missing required fields" };

		const existingAccount = await Accounts.findOne({ $or: [{ username }, { email }] });
		if (existingAccount) throw { status: 400, message: "Username or email already exists" };

		const newAccount = new Accounts({
			username,
			email,
			password,
			accountActive: true,
			subscriptionActive: true,
		});
		await newAccount.save();

		const newProfile = new Profiles({
			name,
			restaurantID: username,
			description: description || "",
			address: address || "",
			themeColor: { h: 220, s: 50, l: 50 }, // default
		});
		await newProfile.save();

		return NextResponse.json({ status: 201, message: "Restaurant created successfully" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
