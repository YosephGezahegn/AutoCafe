"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { Spinner, themeController } from "xtreme-ui";
import { DEFAULT_THEME_COLOR } from "#utils/constants/common";

export default function Logout() {
	const router = useRouter();
	const session = useSession();
	const lockCalled = useRef(false);

	useEffect(() => {
		if (session?.status === "authenticated") {
			const role = session?.data?.role;
			const restaurant = session?.data?.restaurant?.username;
			const table = session?.data?.restaurant?.table;

			localStorage.setItem(
				"logoutData",
				JSON.stringify({ role, restaurant, table }),
			);

			// If customer, lock the table before signing out
			if (role === "customer" && restaurant && table && !lockCalled.current) {
				lockCalled.current = true;
				fetch("/api/table/lock", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ table, restaurantID: restaurant }),
				})
					.catch(() => {})
					.finally(() => {
						// Clear the table session from localStorage
						localStorage.removeItem(`table_session_${table}`);
						signOut();
					});
			} else {
				signOut();
			}
		} else if (session?.status === "unauthenticated") {
			const finishLogout = (role?: string, restaurant?: string, table?: string) => {
				localStorage.removeItem("logoutData");
				localStorage.removeItem("lastTableData");

				if (role === "admin" || role === "superadmin") router.push("/");
				else if (restaurant && table) router.push(`/${restaurant}?table=${table}`);
				else router.push("/");
			};

			try {
				const logoutDataStr = localStorage.getItem("logoutData");
				const lastTableDataStr = localStorage.getItem("lastTableData");

				const logoutData = logoutDataStr ? JSON.parse(logoutDataStr) : null;
				const lastTableData = lastTableDataStr ? JSON.parse(lastTableDataStr) : null;

				const role = logoutData?.role;
				const restaurant = logoutData?.restaurant ?? lastTableData?.restaurant;
				const table = logoutData?.table ?? lastTableData?.table;

				// If we have table info and haven't locked it yet, lock it now
				if (restaurant && table && !lockCalled.current) {
					lockCalled.current = true;
					fetch("/api/table/lock", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ table, restaurantID: restaurant }),
					})
						.catch(() => {})
						.finally(() => {
							localStorage.removeItem(`table_session_${table}`);
							finishLogout(role, restaurant, table);
						});
				} else {
					finishLogout(role, restaurant, table);
				}
			} catch (err) {
				console.log(err);
				router.push("/");
			}
		}
	}, [router, session]);

	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: themeController({ color: DEFAULT_THEME_COLOR }) }} suppressHydrationWarning />
			<Spinner fullpage label="Signing out..." />
		</>
	);
}

