"use client";

import LoginSection from "./LoginSection";
import "./github-banner.scss";

export default function PageContainer() {
	return (
		<div className="homepage">
			<div className="homepageSections">
				<LoginSection />
			</div>
		</div>
	);
}
