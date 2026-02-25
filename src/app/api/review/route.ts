import { NextResponse } from "next/server";
import connectDB from "#utils/database/connect";
import { Reviews } from "#utils/database/models/review";

export async function POST(req: Request) {
	try {
		await connectDB();
		const body = await req.json();
		const { restaurantID, rating, comment, sessionId } = body;

		if (!restaurantID || !rating) {
			return NextResponse.json({ status: 400, message: "Missing required fields" }, { status: 400 });
		}

		await Reviews.create({
			restaurantID,
			rating,
			comment,
			...(sessionId && { sessionId }),
		});

		return NextResponse.json({ status: 200, message: "Review Submitted" }, { status: 200 });
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ status: 500, message: error?.message || "Internal Server Error" }, { status: 500 });
	}
}
