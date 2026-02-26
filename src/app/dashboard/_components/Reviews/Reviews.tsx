"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button, Icon, Spinner } from "xtreme-ui";
import { useSearchParams } from "next/navigation";

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

	// Filters
	const [ratingFilter, setRatingFilter] = useState<number | null>(null);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	const searchParams = useSearchParams();
	const restaurantOverride = searchParams.get("restaurant");
	const apiSuffix = restaurantOverride ? `?restaurant=${restaurantOverride}` : "";

	const fetchReviews = async () => {
		try {
			const res = await fetch(`/api/admin/review${apiSuffix}`);
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
			const separator = apiSuffix ? "&" : "?";
			const res = await fetch(`/api/admin/review${apiSuffix}${apiSuffix ? separator : "?"}id=${reviewId}`, { method: "DELETE" });
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

	const filteredReviews = useMemo(() => {
		return reviews.filter((review) => {
			// Rating filter
			if (ratingFilter !== null && review.rating !== ratingFilter) return false;

			// Date range filter
			if (dateFrom) {
				const fromDate = new Date(dateFrom);
				fromDate.setHours(0, 0, 0, 0);
				if (new Date(review.createdAt) < fromDate) return false;
			}
			if (dateTo) {
				const toDate = new Date(dateTo);
				toDate.setHours(23, 59, 59, 999);
				if (new Date(review.createdAt) > toDate) return false;
			}

			return true;
		});
	}, [reviews, ratingFilter, dateFrom, dateTo]);

	const hasActiveFilters = ratingFilter !== null || dateFrom || dateTo;

	const clearFilters = () => {
		setRatingFilter(null);
		setDateFrom("");
		setDateTo("");
	};

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

			{/* Filter Bar */}
			<div className="filterSection">
				<div className="filterHeader">
					<h3>All Reviews ({filteredReviews.length}{hasActiveFilters ? ` of ${reviews.length}` : ""})</h3>
					<div className="filterActions">
						{hasActiveFilters && (
							<button type="button" className="clearFilterBtn" onClick={clearFilters}>
								<Icon code="f00d" type="solid" size={11} />
								Clear filters
							</button>
						)}
						<button
							type="button"
							className={`toggleFilterBtn ${showFilters ? "active" : ""}`}
							onClick={() => setShowFilters(!showFilters)}>
							<Icon code="f0b0" type="solid" size={13} />
							Filters
							{hasActiveFilters && <span className="filterBadge" />}
						</button>
					</div>
				</div>

				{showFilters && (
					<div className="filterControls">
						{/* Date Range */}
						<div className="filterGroup">
							<label>
								<Icon code="f073" type="solid" size={12} />
								Date Range
							</label>
							<div className="dateRange">
								<input
									type="date"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
									placeholder="From"
								/>
								<span className="dateSep">to</span>
								<input
									type="date"
									value={dateTo}
									onChange={(e) => setDateTo(e.target.value)}
									placeholder="To"
								/>
							</div>
						</div>

						{/* Rating Filter */}
						<div className="filterGroup">
							<label>
								<Icon code="f005" type="solid" size={12} />
								Rating
							</label>
							<div className="ratingFilterChips">
								<button
									type="button"
									className={`ratingChip ${ratingFilter === null ? "active" : ""}`}
									onClick={() => setRatingFilter(null)}>
									All
								</button>
								{[5, 4, 3, 2, 1].map((star) => (
									<button
										key={star}
										type="button"
										className={`ratingChip ${ratingFilter === star ? "active" : ""}`}
										onClick={() => setRatingFilter(ratingFilter === star ? null : star)}>
										{star} <Icon code="f005" type="solid" size={10} />
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Reviews List */}
			<div className="reviewsList">
				{filteredReviews.length === 0 ? (
					<div className="emptyReviews">
						<Icon code="f4ad" type="solid" size={48} />
						<p>{hasActiveFilters ? "No reviews match your filters." : "No reviews yet. Reviews from customers will appear here."}</p>
					</div>
				) : (
					filteredReviews.map((review) => (
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
