import { Suspense } from "react";
import { capitalize } from "xtreme-ui";

import { DashboardProvider } from "#components/context";
import NavSideBar from "#components/layout/NavSideBar";

import PageContainer from "./_components/PageContainer";
import "./dashboard.scss";

const navItems = [
	{ label: "orders", icon: "e43b", value: "orders" },
	{ label: "reviews", icon: "f4ad", value: "reviews" },
	{ label: "menu", icon: "e3e3", value: "menu" },
	{ label: "tables", icon: "f0ce", value: "tables" },
	{ label: "settings", icon: "f013", value: "settings" },
];

export async function generateMetadata({ searchParams }: IMetaDataProps) {
	const s = await searchParams;
	return {
		title: `OrderWorder${s.tab ? ` • ${capitalize(s.tab)}` : ""}`,
	};
}

const Dashboard = () => {
	return (
		<DashboardProvider>
			<div className="dashboard">
				<Suspense>
					<NavSideBar navItems={navItems} defaultTab="orders" head foot />
				</Suspense>
				<Suspense>
					<PageContainer />
				</Suspense>
			</div>
		</DashboardProvider>
	);
};

export default Dashboard;

interface IMetaDataProps {
	params: {
		restaurant: string;
	};
	searchParams: {
		tab?: string;
		[key: string]: string | undefined;
	};
}
