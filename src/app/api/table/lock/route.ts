import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Tables } from "#utils/database/models/table";
import { TableSessions } from "#utils/database/models/tablesession";

/**
 * POST /api/table/lock
 * Called by customers when they log out.
 * Locks the table (sets isActive = false) and clears activeSessionId.
 * Does NOT require admin auth — only needs the table username + restaurant.
 */
export async function POST(req: Request) {
	try {
		await connectDB();
		const { table, restaurantID } = await req.json();

		if (!table || !restaurantID) {
			return NextResponse.json({ status: 400, message: "Missing table or restaurantID" }, { status: 400 });
		}

		const tableDoc = await Tables.findOne({ username: table, restaurantID });

		if (!tableDoc) {
			return NextResponse.json({ status: 404, message: "Table not found" }, { status: 404 });
		}

		// Close the table session if one is active
		if (tableDoc.activeSessionId) {
			const sessionDoc = await TableSessions.findOne({ sessionId: tableDoc.activeSessionId, restaurantID });
			if (sessionDoc && !sessionDoc.endTime) {
				const end = new Date();
				const durationMs = end.getTime() - new Date(sessionDoc.startTime).getTime();
				sessionDoc.endTime = end;
				sessionDoc.durationMinutes = Math.round(durationMs / 60000);
				await sessionDoc.save();
			}
		}

		// Lock the table
		tableDoc.isActive = false;
		tableDoc.activeSessionId = null;
		await tableDoc.save();

		return NextResponse.json({ status: 200, message: "Table locked successfully" });
	} catch (error: any) {
		return NextResponse.json({ status: 500, message: error?.message }, { status: 500 });
	}
}
