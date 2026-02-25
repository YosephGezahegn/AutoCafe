import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { StaffCalls } from "#utils/database/models/staffcall";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });

		await connectDB();
		const body = await req.json();
		const { callId, action } = body;

		if (!callId || action !== "resolve") throw { status: 400, message: "Invalid request" };

		const updatedCall = await StaffCalls.findByIdAndUpdate(callId, { status: "resolved" }, { new: true });

		if (!updatedCall) throw { status: 404, message: "Staff call not found" };

		return NextResponse.json({ status: 200, message: "Staff call resolved successfully" });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
