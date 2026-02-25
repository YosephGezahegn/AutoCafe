import type { ReactNode } from "react";
import { themeController } from "xtreme-ui";

export const metadata = {
	title: "OrderWorder ⌘ Super Admin",
};

export default function Layout({ children }: { children?: ReactNode }) {
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: themeController({ color: { h: 220, s: 50, l: 50 } }) }} suppressHydrationWarning />
			{children}
		</>
	);
}
