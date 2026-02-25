import { NextResponse } from "next/server";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Menus } from "#utils/database/models/menu";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { Reviews } from "#utils/database/models/review";
import { Tables } from "#utils/database/models/table";

import empire from "../refreshDemoData/_data/empire/empire";
import goldengate from "../refreshDemoData/_data/goldengate/goldengate";
import starbucks from "../refreshDemoData/_data/starbucks/starbucks";

type TDocumentData = {
	account: any;
	profile: any;
	menus: Array<any>;
	tables: Array<any>;
};

const createData = async (props: TDocumentData) => {
	const { account, profile, menus, tables } = props;
	const newAccount = await new Accounts(account).save();
	const newProfile = await new Profiles(profile).save();
	const [newMenus, newTables] = await Promise.all([Promise.all(menus.map((m) => new Menus(m).save())), Promise.all(tables.map((t) => new Tables(t).save()))]);
	return { account: newAccount, profile: newProfile, menus: newMenus, tables: newTables };
};

const generateReviews = (restaurantID: string) => {
	const comments = [
		"Amazing food! The flavors were incredible and the service was top-notch.",
		"Great ambiance and friendly staff. Will definitely come back!",
		"The menu variety is impressive. Loved every dish we tried.",
		"Decent food but the wait time was a bit long.",
		"One of the best dining experiences I've had in a while.",
		"Food quality was excellent. Slightly overpriced but worth it.",
		"Perfect place for a family dinner. Kids loved it too!",
		"The chef's special was out of this world. Highly recommend!",
		"Good portions and fair pricing. A solid choice for lunch.",
		"Nice atmosphere but the music was a bit too loud.",
		"Authentic flavors that remind me of home cooking.",
		"Quick service and tasty food. Great for a quick bite.",
	];

	return comments.map((comment, i) => ({
		restaurantID,
		rating: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3))),
		comment,
		createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * Math.random() * 30),
	}));
};

// GET /api/seed
export async function GET() {
	try {
		const start = performance.now();
		await connectDB();

		// Clear ALL existing data
		await Promise.all([Accounts.deleteMany({}), Profiles.deleteMany({}), Tables.deleteMany({}), Menus.deleteMany({}), Orders.deleteMany({}), Reviews.deleteMany({})]);

		// Create demo restaurant data
		const datasets: TDocumentData[] = [empire, starbucks, goldengate];
		const results: Record<string, any> = {};

		for (const dataset of datasets) {
			results[dataset.account.username] = await createData(dataset);
		}

		// Create super admin
		await new Accounts({
			username: "superadmin",
			email: "superadmin@orderworder.com",
			password: "password123",
			verified: true,
			accountActive: true,
			subscriptionActive: true,
			isSuperAdmin: true,
		}).save();

		await new Profiles({
			name: "Super Admin",
			restaurantID: "superadmin",
			description: "Global Administrator",
			address: "Cloud",
			themeColor: { h: 220, s: 50, l: 50 },
		}).save();

		// Generate review data for each restaurant
		const allReviews = [...generateReviews("empire"), ...generateReviews("starbucks"), ...generateReviews("goldengate")];
		await Reviews.insertMany(allReviews);

		return NextResponse.json({
			message: "Seed successful",
			status: 200,
			processTime: `${((performance.now() - start) / 1000).toFixed(2)}s`,
			restaurants: Object.keys(results),
			reviewsCreated: allReviews.length,
		});
	} catch (error: any) {
		console.error("Seed error: ", error);
		return NextResponse.json({ message: "Seed failed", error: error.message, status: 500 }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";
