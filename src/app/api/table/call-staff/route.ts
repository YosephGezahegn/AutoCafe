import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { StaffCalls } from "#utils/database/models/staffcall";
import { Tables } from "#utils/database/models/table";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		await connectDB();
		const body = await req.json();
		const { table, restaurantID, reason } = body;

		if (!table || !restaurantID) throw { status: 400, message: "Missing required fields" };

		const tableDoc = await Tables.findOne({ username: table, restaurantID });
		if (!tableDoc) throw { status: 404, message: "Table not found" };
		if (!tableDoc.isActive) throw { status: 400, message: "Table is not active" };

		const session = await getServerSession(authOptions);

		const newCall = new StaffCalls({
			restaurantID,
			table: tableDoc.username,
			tableName: tableDoc.name,
			customer: session?.id,
			reason: reason || "General assistance",
			sessionId: tableDoc.activeSessionId,
			status: "active",
		});
		await newCall.save();

		return NextResponse.json({
			status: 200,
			message: "Staff has been notified! Someone will be with you shortly.",
			data: {
				table: tableDoc.name,
				reason: reason || "General assistance",
				timestamp: new Date().toISOString(),
			},
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
