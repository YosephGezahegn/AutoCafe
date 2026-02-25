import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Menus } from "#utils/database/models/menu";
import { Profiles } from "#utils/database/models/profile";
import { Tables } from "#utils/database/models/table";
import { CatchNextResponse } from "#utils/helper/common";

import empire from "./_data/empire/empire";
import goldengate from "./_data/goldengate/goldengate";
import starbucks from "./_data/starbucks/starbucks";

const deleteData = async (ids: string[]) => {
	const start = performance.now();
	const models = [
		{ model: Menus, name: "Menus" },
		{ model: Profiles, name: "Profiles" },
		{ model: Tables, name: "Tables" },
		{ model: Accounts, name: "Accounts", field: "username" },
	];

	const results = await Promise.all(
		models.map(async ({ model, name, field = "restaurantID" }) => {
			const res = await model.deleteMany({ [field]: { $in: ids } });
			return { model: name, ...res };
		}),
	);

	return {
		processTime: (performance.now() - start) / 1000,
		results,
	};
};

const createData = async (props: TDocumentData) => {
	const { account, profile, menus, tables } = props;
	const start = performance.now();
	const newAccount = await new Accounts(account).save();
	const newProfile = await new Profiles(profile).save();
	const [newMenus, newTables] = await Promise.all([Promise.all(menus.map((m) => new Menus(m).save())), Promise.all(tables.map((t) => new Tables(t).save()))]);

	return {
		processTime: (performance.now() - start) / 1000,
		account: newAccount,
		profile: newProfile,
		menus: newMenus,
		tables: newTables,
	};
};

export async function GET() {
	await connectDB();
	try {
		const start = performance.now();
		const deleteResult = await deleteData(["empire", "starbucks", "goldengate"]);
		await Accounts.deleteMany({ username: "superadmin" });
		await Profiles.deleteMany({ restaurantID: "superadmin" });
		const [empireResult, starbucksResult, goldengateResult] = await Promise.all([createData(empire), createData(starbucks), createData(goldengate)]);

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

		const res = {
			totalProcessTime: (performance.now() - start) / 1000,
			delete: deleteResult,
			empire: empireResult,
			starbucks: starbucksResult,
			goldengate: goldengateResult,
		};
		return new Response(JSON.stringify(res, null, 4));
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

type TDocumentData = {
	account: unknown;
	profile: unknown;
	menus: Array<unknown>;
	tables: Array<unknown>;
};
