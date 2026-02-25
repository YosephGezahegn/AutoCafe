import * as fs from "node:fs";
import * as path from "node:path";
import * as bcrypt from "bcrypt";
import mongoose from "mongoose";

// Extremely basic env loader for local testing without external libraries
try {
	const envPath = path.resolve(process.cwd(), ".env");
	const envContent = fs.readFileSync(envPath, "utf-8");
	envContent.split("\n").forEach((line) => {
		const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
		if (match) {
			process.env[match[1]] = match[2];
		}
	});
} catch (_e) {
	// Ignore if file doesn't exist
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/orderworder";

async function seed() {
	console.log("Connecting to MongoDB...");
	await mongoose.connect(MONGODB_URI);
	console.log("Connected!");

	// Clear everything
	const collections = (await mongoose.connection.db?.collections()) || [];
	for (const collection of collections) {
		await collection.drop();
	}
	console.log("Cleared existing data.");

	console.log("Creating Admin Account...");
	const hashedPassword = await bcrypt.hash("password123", 10);
	const accountResult = await mongoose.connection.collection("accounts").insertOne({
		username: "bobsburgers",
		email: "bob@orderworder.com",
		password: hashedPassword,
		verified: true,
		accountActive: true,
		subscriptionActive: true,
		tables: [],
		menus: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	const accountId = accountResult.insertedId;

	console.log("Creating Profile...");
	const profileResult = await mongoose.connection.collection("profiles").insertOne({
		name: "Bob's Burgers",
		restaurantID: "bobsburgers",
		description: "Gourmet burgers and more!",
		address: "Ocean Avenue, Seymour's Bay",
		themeColor: { h: 0, s: 0, l: 0 },
		gstInclusive: true,
		categories: ["burgers", "sides", "drinks"],
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	const profileId = profileResult.insertedId;

	// Link profile to account
	await mongoose.connection.collection("accounts").updateOne({ _id: accountId }, { $set: { profile: profileId } });

	console.log("Creating Tables...");
	const tableIds = [];
	for (let i = 1; i <= 7; i++) {
		const tr = await mongoose.connection.collection("tables").insertOne({
			name: `Table ${i}`,
			username: `table-${i}`,
			restaurantID: "bobsburgers",
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		tableIds.push(tr.insertedId);
	}

	await mongoose.connection.collection("accounts").updateOne({ _id: accountId }, { $push: { tables: { $each: tableIds } } });

	console.log("Creating Menu Items...");
	const menuIds = [];
	const categoriesChoices = ["burgers", "sides", "drinks", "desserts"];
	for (let i = 1; i <= 23; i++) {
		const category = categoriesChoices[i % categoriesChoices.length];
		const mr = await mongoose.connection.collection("menus").insertOne({
			name: `Gourmet Food Item ${i}`,
			restaurantID: "bobsburgers",
			description: `A delicious ${category} item tailored for your taste`,
			category: category,
			price: 5.0 + (i % 10),
			taxPercent: 5,
			foodType: i % 2 === 0 ? "sweet" : "spicy",
			veg: i % 3 === 0 ? "veg" : "non-veg",
			image: "https://i.imgflip.com/812mvl.jpg",
			hidden: false,
			nutritionalValue: { calories: 300 + i * 10, protein: 10 + i, carbs: 20 + i, fats: 5 + i },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		menuIds.push(mr.insertedId);
	}

	await mongoose.connection.collection("accounts").updateOne({ _id: accountId }, { $push: { menus: { $each: menuIds } } });

	console.log("Seeding Complete!");
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
