import mongoose, { type HydratedDocument } from "mongoose";

const TableSessionSchema = new mongoose.Schema<TTableSession>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		table: { type: String, trim: true, required: true },
		tableName: { type: String, trim: true, required: true },
		sessionId: { type: String, trim: true, required: true },
		startTime: { type: Date, required: true },
		endTime: { type: Date, default: null },
		durationMinutes: { type: Number, default: null },
	},
	{ timestamps: true },
);

export const TableSessions = mongoose.models?.tablesessions ?? mongoose.model<TTableSession>("tablesessions", TableSessionSchema);

export type TTableSession = HydratedDocument<{
	restaurantID: string;
	table: string;
	tableName: string;
	sessionId: string;
	startTime: Date;
	endTime?: Date | null;
	durationMinutes?: number | null;
	createdAt: Date;
	updatedAt: Date;
}>;
