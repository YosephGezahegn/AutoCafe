import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

/* PATCH /api/superadmin/restaurants/[id]
 * Body: { action: "deactivate" | "activate" }
 * Toggles accountActive for a restaurant account.
 */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };
		if (session.role !== "superadmin") throw { status: 403, message: "Super Admin Required" };

		const { id } = await context.params;
		const body = await req.json();
		const { action } = body;

		if (!["deactivate", "activate"].includes(action)) {
			throw { status: 400, message: "Invalid action. Use 'deactivate' or 'activate'." };
		}

		const account = await Accounts.findById(id);
		if (!account) throw { status: 404, message: "Restaurant account not found" };
		if (account.isSuperAdmin) throw { status: 403, message: "Cannot modify superadmin account" };

		account.accountActive = action === "activate";
		await account.save();

		return NextResponse.json({
			status: 200,
			message: action === "deactivate" ? "Restaurant deactivated successfully" : "Restaurant activated successfully",
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

/* DELETE /api/superadmin/restaurants/[id]
 * Permanently removes a restaurant account.
 */
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };
		if (session.role !== "superadmin") throw { status: 403, message: "Super Admin Required" };

		const { id } = await context.params;

		const account = await Accounts.findById(id);
		if (!account) throw { status: 404, message: "Restaurant account not found" };
		if (account.isSuperAdmin) throw { status: 403, message: "Cannot remove superadmin account" };

		await Accounts.findByIdAndDelete(id);

		return NextResponse.json({
			status: 200,
			message: "Restaurant removed successfully",
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
