"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Icon, Spinner } from "xtreme-ui";

import "./reviews.scss";

interface TReview {
	_id: string;
	restaurantID: string;
	rating: number;
	comment?: string;
	createdAt: string;
}

interface TStats {
	totalReviews: number;
	averageRating: number;
	ratingDistribution: Array<{ star: number; count: number }>;
}

export default function Reviews({ onScroll }: { onScroll?: (e: React.UIEvent<HTMLDivElement>) => void }) {
	const [reviews, setReviews] = useState<TReview[]>([]);
	const [stats, setStats] = useState<TStats | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchReviews = async () => {
		try {
			const res = await fetch("/api/admin/review");
			const json = await res.json();
			if (res.ok) {
				setReviews(json.data.reviews);
				setStats(json.data.stats);
			} else {
				toast.error(json.message || "Failed to load reviews");
			}
		} catch {
			toast.error("Error loading reviews");
		} finally {
			setLoading(false);
		}
	};

	const deleteReview = async (reviewId: string) => {
		try {
			const res = await fetch(`/api/admin/review?id=${reviewId}`, { method: "DELETE" });
			const json = await res.json();
			if (res.ok) {
				toast.success("Review deleted");
				setReviews((prev) => prev.filter((r) => r._id !== reviewId));
				fetchReviews(); // refresh stats
			} else {
				toast.error(json.message || "Failed to delete review");
			}
		} catch {
			toast.error("Error deleting review");
		}
	};

	useEffect(() => {
		fetchReviews();
	}, []);

	if (loading) return <Spinner label="Loading Reviews..." fullpage />;

	const maxCount = stats ? Math.max(...stats.ratingDistribution.map((d) => d.count), 1) : 1;

	return (
		<div className="adminReviews" onScroll={onScroll}>
			{/* Stats Cards */}
			<div className="statsRow">
				<div className="statCard highlight">
					<div className="statIcon">
						<Icon code="f005" type="solid" size={24} />
					</div>
					<div className="statContent">
						<span className="statValue">{stats?.averageRating?.toFixed(1) ?? "—"}</span>
						<span className="statLabel">Average Rating</span>
					</div>
				</div>
				<div className="statCard">
					<div className="statIcon">
						<Icon code="f4ad" type="solid" size={24} />
					</div>
					<div className="statContent">
						<span className="statValue">{stats?.totalReviews ?? 0}</span>
						<span className="statLabel">Total Reviews</span>
					</div>
				</div>
				<div className="statCard">
					<div className="statIcon positive">
						<Icon code="f005" type="solid" size={24} />
					</div>
					<div className="statContent">
						<span className="statValue">{reviews.filter((r) => r.rating >= 4).length}</span>
						<span className="statLabel">Positive</span>
					</div>
				</div>
				<div className="statCard">
					<div className="statIcon negative">
						<Icon code="f5c0" type="solid" size={24} />
					</div>
					<div className="statContent">
						<span className="statValue">{reviews.filter((r) => r.rating <= 2).length}</span>
						<span className="statLabel">Negative</span>
					</div>
				</div>
			</div>

			{/* Rating Distribution */}
			{stats && (
				<div className="distributionCard">
					<h3>Rating Distribution</h3>
					<div className="distributionBars">
						{stats.ratingDistribution
							.slice()
							.reverse()
							.map((d) => (
								<div key={d.star} className="distributionRow">
									<span className="starLabel">
										{d.star} <Icon code="f005" type="solid" size={12} />
									</span>
									<div className="barTrack">
										<div className="barFill" style={{ width: `${(d.count / maxCount) * 100}%` }} />
									</div>
									<span className="barCount">{d.count}</span>
								</div>
							))}
					</div>
				</div>
			)}

			{/* Reviews List */}
			<div className="reviewsList">
				<h3>All Reviews ({reviews.length})</h3>
				{reviews.length === 0 ? (
					<div className="emptyReviews">
						<Icon code="f4ad" type="solid" size={48} />
						<p>No reviews yet. Reviews from customers will appear here.</p>
					</div>
				) : (
					reviews.map((review) => (
						<div key={review._id} className="reviewCard">
							<div className="reviewHeader">
								<div className="reviewStars">
									{[1, 2, 3, 4, 5].map((star) => (
										<Icon key={star} code="f005" type="solid" size={14} set={star <= review.rating ? "classic" : "duotone"} />
									))}
								</div>
								<span className="reviewDate">
									{new Date(review.createdAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
									})}
								</span>
							</div>
							{review.comment && <p className="reviewComment">{review.comment}</p>}
							<div className="reviewActions">
								<Button label="Delete" type="secondaryDanger" icon="f1f8" iconType="solid" onClick={() => deleteReview(review._id)} />
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
