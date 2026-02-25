"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Icon } from "xtreme-ui";
import { useLanguage } from "#components/context/LanguageContext";
import { useRestaurant } from "#components/context/useContext";
import "./reviewsPage.scss";

export default function ReviewsPage() {
	const searchParams = useSearchParams();
	const table = searchParams.get("table");

	const { restaurant } = useRestaurant();
	const { t } = useLanguage();
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (rating === 0) {
			toast.error("Please select a rating before submitting.");
			return;
		}

		setIsSubmitting(true);

		try {
			const res = await fetch("/api/review", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					restaurantID: restaurant?.username,
					rating,
					comment,
					sessionId: table ? localStorage.getItem(`table_session_${table}`) : undefined,
				}),
			});
			const json = await res.json();

			if (res.ok) {
				setRating(0);
				setHoveredRating(0);
				setComment("");
				toast.success("Thank you for your review!");
			} else {
				toast.error(json.message || "Failed to submit review.");
			}
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="reviewsPage">
			<div className="reviewsHeader">
				<h1>{t("Customer Reviews")}</h1>
			</div>

			<form className="reviewForm" onSubmit={handleSubmit}>
				<div className="ratingSelect">
					<p>
						{t("How was your experience at")} {restaurant?.profile?.name ?? "our restaurant"}?
					</p>
					<div className="stars" onMouseLeave={() => setHoveredRating(0)}>
						{[1, 2, 3, 4, 5].map((star) => (
							<div
								key={star}
								className={`star ${star <= (hoveredRating || rating) ? "active" : ""}`}
								onMouseEnter={() => setHoveredRating(star)}
								onClick={() => setRating(star)}>
								<Icon
									code={star <= (hoveredRating || rating) ? "f005" : "e4f9"}
									type="solid"
									size={32}
									set={star <= (hoveredRating || rating) ? "classic" : "duotone"}
								/>
							</div>
						))}
					</div>
				</div>

				<div className="commentInput">
					<label htmlFor="comment">{t("Leave a comment (Optional)")}</label>
					<textarea
						id="comment"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder="Tell us about the food, the service, or the atmosphere..."
						rows={5}
					/>
				</div>

				<Button
					type="primary"
					label={isSubmitting ? t("Submitting...") : t("Submit Review")}
					disabled={rating === 0 || isSubmitting}
					onClick={() => {}} // Button component usually passes down clicks if not strictly type Submit
				/>
			</form>
		</div>
	);
}
