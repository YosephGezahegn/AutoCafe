import mongoose, { type HydratedDocument } from "mongoose";

import type { TCustomer } from "./customer";

const StaffCallSchema = new mongoose.Schema<TStaffCall>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		table: { type: String, trim: true, required: true },
		tableName: { type: String, trim: true, required: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers" },
		reason: { type: String, trim: true, default: "General assistance" },
		sessionId: { type: String, trim: true },
		status: { type: String, enum: ["active", "resolved"], default: "active" },
	},
	{ timestamps: true },
);

export const StaffCalls = mongoose.models?.staffcalls ?? mongoose.model<TStaffCall>("staffcalls", StaffCallSchema);

export type TStaffCall = HydratedDocument<{
	restaurantID: string;
	table: string;
	tableName: string;
	customer?: TCustomer;
	reason: string;
	sessionId?: string;
	status: "active" | "resolved";
	createdAt: Date;
	updatedAt: Date;
}>;
