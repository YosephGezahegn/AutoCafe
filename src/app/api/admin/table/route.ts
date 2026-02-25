import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { StaffCalls } from "#utils/database/models/staffcall";
import { Tables } from "#utils/database/models/table";
import { TableSessions } from "#utils/database/models/tablesession";
import { authOptions } from "#utils/helper/authHelper";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" });

		await connectDB();
		const body = await req.json();

		const newTable = new Tables({
			...body,
			restaurantID: session.username,
			isActive: false, // Default to false when creating. Need admin to activate
		});

		await newTable.save();

		return NextResponse.json({ status: 200, message: "Table Created Successfully" });
	} catch (error: any) {
		return NextResponse.json({ status: 500, message: error?.message });
	}
}

export async function PUT(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" });

		await connectDB();
		const body = await req.json();
		const { id, isActive } = body;

		if (!id) throw new Error("Missing table ID");

		const updateDoc = {
			isActive,
			...(isActive === false && { activeSessionId: null }),
		};

		const prevTable = await Tables.findById(id);

		if (isActive === false && prevTable?.activeSessionId) {
			const activeOrders = await Orders.countDocuments({ sessionId: prevTable.activeSessionId, state: "active" });
			const activeStaffCalls = await StaffCalls.countDocuments({ sessionId: prevTable.activeSessionId, status: "active" });

			if (activeOrders > 0 || activeStaffCalls > 0) {
				return NextResponse.json({ status: 400, message: "Cannot lock table while there are pending orders or staff calls." }, { status: 400 });
			}
		}

		const result = await Tables.findByIdAndUpdate(id, updateDoc, { new: true });
		console.log("UPDATING TABLE:", { id, updateDoc, result });

		if (!result) {
			return NextResponse.json({ status: 404, message: "Table not found in database" });
		}

		if (isActive === false && prevTable?.activeSessionId) {
			const sessionDoc = await TableSessions.findOne({ sessionId: prevTable.activeSessionId, restaurantID: session.username });
			if (sessionDoc && !sessionDoc.endTime) {
				const end = new Date();
				const durationMs = end.getTime() - new Date(sessionDoc.startTime).getTime();
				sessionDoc.endTime = end;
				sessionDoc.durationMinutes = Math.round(durationMs / 60000);
				await sessionDoc.save();
			}
		}

		return NextResponse.json({ status: 200, message: `Table ${isActive ? "Activated" : "Locked"} Successfully` });
	} catch (error: any) {
		return NextResponse.json({ status: 500, message: error?.message });
	}
}

export async function DELETE(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" });

		await connectDB();
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");
		if (!id) return NextResponse.json({ status: 400, message: "Missing table ID" });

		await Tables.findByIdAndDelete(id);

		return NextResponse.json({ status: 200, message: "Table Removed Successfully" });
	} catch (error: any) {
		return NextResponse.json({ status: 500, message: error?.message });
	}
}
