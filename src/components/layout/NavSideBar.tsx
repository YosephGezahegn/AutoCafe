"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Icon } from "xtreme-ui";
import { useLanguage } from "#components/context/LanguageContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";

import "./navSideBar.scss";

const NavSideBar = (props: TNavSideBar) => {
	const { head, foot, navItems, defaultTab } = props;
	const router = useRouter();
	const session = useSession();
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "";

	const { t, language, setLanguage } = useLanguage();
	const classList = clsx("menu", head && "head", foot && "foot");

	const toggleLanguage = () => {
		setLanguage(language === "en" ? "am" : "en");
	};

	const onNavClick = (tab: string) => {
		if (tab === "signout") return router.push("/logout");
		queryParams.set({ tab });
	};

	useEffect(() => {
		if (!tab) queryParams.set({ tab: defaultTab });
	}, [defaultTab, queryParams, tab]);

	return (
		<div className="navSideBar">
			<div className={classList}>
				{/* Logout shortcut – pinned at top via .head CSS, always visible */}
				<div className="navItem signoutItem" onClick={() => router.push("/logout")} title="Logout">
					<div className="navItemContent">
						<Icon code="f011" size={18} type="solid" />
						<p>{t("logout")}</p>
					</div>
				</div>

				{navItems.map((item, key) => {
					if (item.value === "signout" && session.status !== "authenticated") return null;

					const active = tab === item.value;
					return (
						<div key={key} className={clsx("navItem", active && "active")} onClick={() => onNavClick(item.value)}>
							<div className="navItemContent">
								<Icon code={item.icon} size={20} set={active ? "classic" : "duotone"} type="solid" />
								<p>{t(item.label)}</p>
							</div>
						</div>
					);
				})}

				{/* Language toggle – pinned at bottom via .foot CSS */}
				<div className="navItem" onClick={toggleLanguage}>
					<div className="navItemContent">
						<Icon code="f0ac" size={20} type="solid" />
						<p>{language === "en" ? "Amharic" : "English"}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NavSideBar;

type TNavSideBar = {
	navItems: Array<{ label: string; value: string; icon: string }>;
	defaultTab: string;
	head?: boolean;
	foot?: boolean;
};
