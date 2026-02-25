import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Menus } from "#utils/database/models/menu";
import { Profiles } from "#utils/database/models/profile";
import { authOptions } from "#utils/helper/authHelper";

async function handleFileUpload(formData: FormData): Promise<string | undefined> {
	const file = formData.get("imageFile") as File | null;
	if (!file || file.size === 0) return undefined;

	const buffer = Buffer.from(await file.arrayBuffer());
	const filename = `${Date.now()}_${file.name.replaceAll(" ", "_")}`;

	const publicDir = path.join(process.cwd(), "public");
	const uploadsDir = path.join(publicDir, "uploads");

	try {
		await mkdir(uploadsDir, { recursive: true });
	} catch (_e) {
		// Ignore if it exists
	}

	await writeFile(path.join(uploadsDir, filename), buffer);
	return `/uploads/${filename}`;
}

function parseMenuData(formData: FormData) {
	const data: any = {};
	Array.from(formData.entries()).forEach(([key, value]) => {
		if (key === "imageFile") return;
		if (key.startsWith("nutritionalValue.")) {
			const subKey = key.split(".")[1];
			if (!data.nutritionalValue) data.nutritionalValue = {};
			data.nutritionalValue[subKey] = Number(value);
		} else if (["price", "taxPercent"].includes(key)) {
			data[key] = Number(value);
		} else if (["hidden"].includes(key)) {
			data[key] = value === "true";
		} else {
			data[key] = value;
		}
	});
	return data;
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });

		await connectDB();
		const formData = await req.formData();
		const imagePath = await handleFileUpload(formData);
		const body = parseMenuData(formData);

		const newMenu = new Menus({
			...body,
			image: imagePath || body.image,
			restaurantID: session.username,
			hidden: false,
		});

		await newMenu.save();

		if (body.category) {
			await Profiles.updateOne({ restaurantID: session.username }, { $addToSet: { categories: body.category.toLowerCase() } });
		}

		return NextResponse.json({ status: 200, message: "Menu Created Successfully" }, { status: 200 });
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ status: 500, message: error?.message }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });

		await connectDB();
		const formData = await req.formData();
		const imagePath = await handleFileUpload(formData);
		const body = parseMenuData(formData);
		const { id, ...updateData } = body;

		if (imagePath) {
			updateData.image = imagePath;
		}

		await Menus.findByIdAndUpdate(id, updateData);

		if (updateData.category) {
			await Profiles.updateOne({ restaurantID: session.username }, { $addToSet: { categories: updateData.category.toLowerCase() } });
		}

		return NextResponse.json({ status: 200, message: "Menu Updated Successfully" }, { status: 200 });
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ status: 500, message: error?.message }, { status: 500 });
	}
}

export async function DELETE(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (session?.role !== "admin") return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });

		await connectDB();
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");
		if (!id) return NextResponse.json({ status: 400, message: "Missing menu item ID" }, { status: 400 });

		await Menus.findByIdAndDelete(id);

		return NextResponse.json({ status: 200, message: "Menu Item Deleted Successfully" }, { status: 200 });
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ status: 500, message: error?.message }, { status: 500 });
	}
}
