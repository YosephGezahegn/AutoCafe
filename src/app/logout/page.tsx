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
			try {
				const { role, restaurant, table } = JSON.parse(localStorage.getItem("logoutData") ?? "");
				localStorage.removeItem("logoutData");

				if (role === "admin" || role === "superadmin") router.push("/");
				else if (role === "customer") router.push(`/${restaurant}?table=${table}`);
				else router.push("/");
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

