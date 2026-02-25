import mongoose from "mongoose";
import { ID_SUFFIX, REF_GOLDENGATE, TYPE_ACCOUNT, TYPE_PROFILE, TYPE_TABLE } from "../constants";
import { menus } from "./goldengateMenu";

const account = {
	_id: new mongoose.Types.ObjectId(`${REF_GOLDENGATE}${TYPE_ACCOUNT}${ID_SUFFIX}000001`),
	email: "admin@goldengatehotelhawassa.com",
	username: "goldengate",
	password: "password123",
	verified: true,
};

const profile = {
	_id: new mongoose.Types.ObjectId(`${REF_GOLDENGATE}${TYPE_PROFILE}${ID_SUFFIX}000001`),
	name: "Golden Gate Hotel Hawassa",
	restaurantID: "goldengate",
	description: "Authentic Ethiopian Cuisine and Accommodations in the heart of Hawassa.",
	address: "Hawassa, Ethiopia",
	themeColor: { h: 42, s: 87, l: 55 },
	avatar: "https://goldengatehotelhawassa.com/wp-content/uploads/2021/04/GG-Logo.png",
	cover: "https://goldengatehotelhawassa.com/wp-content/uploads/2021/04/slider2.jpg",
	photos: [],
	categories: ["Main Course", "Vegetarian", "Beverages"],
};

const tables = Array.from({ length: 5 }, (_, i) => ({
	_id: new mongoose.Types.ObjectId(`${REF_GOLDENGATE}${TYPE_TABLE}${ID_SUFFIX}${i.toString().padStart(6, "0")}`),
	restaurantID: "goldengate",
	name: `Table ${i + 1}`,
	username: `table${i + 1}`,
	isActive: true,
}));

const goldengate = {
	account,
	profile,
	menus,
	tables,
};

export default goldengate;
