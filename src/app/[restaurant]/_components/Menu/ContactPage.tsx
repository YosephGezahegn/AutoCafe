"use client";

import { Icon } from "xtreme-ui";
import { useLanguage } from "#components/context/LanguageContext";
import { useRestaurant } from "#components/context/useContext";
import "./contactPage.scss";

export default function ContactPage() {
	const { restaurant } = useRestaurant();
	const { t } = useLanguage();
	const profile = restaurant?.profile;
	const restaurantName = profile?.name ?? restaurant?.username ?? "Restaurant";

	return (
		<div className="contactPage">
			<div className="contactHeader">
				<h1>{t("Get in touch with us")}</h1>
			</div>

			<div className="contactBody">
				{/* Restaurant summary card */}
				<div className="restaurantCard">
					{profile?.cover && (
						<div className="restaurantCover">
							<span style={{ background: `url(${profile.cover}) center/cover no-repeat` }} />
						</div>
					)}
					<div className="restaurantInfo">
						{profile?.avatar && (
							<div className="restaurantAvatar">
								<span style={{ background: `url(${profile.avatar}) center/cover no-repeat` }} />
							</div>
						)}
						<h2>{restaurantName}</h2>
						{profile?.description && <p className="restaurantDesc">{profile.description}</p>}
						{profile?.categories && profile.categories.length > 0 && (
							<div className="categoryTags">
								{profile.categories.map((cat: string, i: number) => (
									<span key={i} className="categoryTag">
										{cat}
									</span>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Address */}
				{profile?.address ? (
					<div className="contactDetails">
						<h3 className="sectionTitle">Location</h3>
						<a
							className="contactItem"
							href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Open in Google Maps">
							<div className="contactIcon">
								<Icon code="f3c5" type="solid" size={18} />
							</div>
							<div className="contactText">
								<span className="contactLabel">Address</span>
								<span className="contactValue">{profile.address}</span>
							</div>
							<Icon className="externalIcon" code="f35d" type="solid" size={12} />
						</a>
					</div>
				) : (
					<div className="noContactInfo">
						<div className="noContactIcon">
							<Icon code="f3c5" type="solid" size={32} />
						</div>
						<p>Location details are not available yet. Please ask our staff for assistance.</p>
					</div>
				)}

				{/* Powered by banner */}
				<div className="poweredBy">
					<Icon code="f005" type="solid" size={12} />
					<span>Contactless ordering powered by OrderWorder</span>
				</div>
			</div>
		</div>
	);
}
