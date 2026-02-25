import mongoose, { type HydratedDocument } from "mongoose";

const ReviewSchema = new mongoose.Schema<TReview>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		comment: { type: String, trim: true },
		sessionId: { type: String, trim: true },
	},
	{ timestamps: true },
);

export const Reviews = mongoose.models?.reviews ?? mongoose.model<TReview>("reviews", ReviewSchema);

export type TReview = HydratedDocument<{
	restaurantID: string;
	rating: number;
	comment?: string;
	sessionId?: string;
	createdAt: Date;
	updatedAt: Date;
}>;
