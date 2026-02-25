import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Tables } from "#utils/database/models/table";
import { TableSessions } from "#utils/database/models/tablesession";

export async function POST(req: Request) {
	try {
		await connectDB();
		const body = await req.json();
		const { table, restaurantID, sessionId } = body;

		if (!table || !restaurantID || !sessionId) {
			return NextResponse.json({ status: 400, message: "Missing info" }, { status: 400 });
		}

		const tableData = await Tables.findOne({ username: table, restaurantID });
		if (!tableData) {
			return NextResponse.json({ status: 404, message: "Table not found" }, { status: 404 });
		}

		if (!tableData.isActive) {
			return NextResponse.json({ status: 403, message: "Table is locked by staff" }, { status: 403 });
		}

		if (!tableData.activeSessionId) {
			tableData.activeSessionId = sessionId;
			await tableData.save();

			await TableSessions.create({
				restaurantID,
				table: tableData.username,
				tableName: tableData.name,
				sessionId,
				startTime: new Date(),
			});

			return NextResponse.json({ status: 200, message: "Table claimed" });
		}

		if (tableData.activeSessionId !== sessionId) {
			return NextResponse.json({ status: 403, message: "Table is already in use by another person." }, { status: 403 });
		}

		return NextResponse.json({ status: 200 });
	} catch (error: any) {
		return NextResponse.json({ status: 500, message: error?.message || "Server Error" }, { status: 500 });
	}
}
