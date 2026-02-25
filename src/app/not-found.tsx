import Link from "next/link";
import { Icon } from "xtreme-ui";

import "./not-found.scss";

export default function NotFound() {
	return (
		<div className="notFoundPage">
			<div className="notFoundContainer">
				<div className="iconWrapper">
					<Icon code="f071" type="solid" size={64} className="warningIcon" />
				</div>
				<h1 className="notFoundTitle">Restaurant Not Found</h1>
				<p className="notFoundDesc">We couldn"t find the restaurant you"re looking for. It may have been removed, or the URL might be incorrect.</p>
				<Link href="/" className="homeLink">
					Return Home
				</Link>
			</div>
		</div>
	);
}
