"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Icon, Spinner } from "xtreme-ui";

import "./superadmin.scss";

interface RestaurantProfile {
	_id: string;
	name: string;
	restaurantID: string;
	address?: string;
	description?: string;
	avatar?: string;
	cover?: string;
	categories?: string[];
	createdAt?: string;
}

interface RestaurantAccount {
	_id: string;
	username: string;
	email: string;
	accountActive: boolean;
	subscriptionActive: boolean;
	profile?: string;
	menus?: string[];
	tables?: string[];
	createdAt?: string;
}

interface PlatformStats {
	totalRestaurants: number;
	activeRestaurants: number;
	totalMenuItems: number;
	totalTables: number;
	totalOrders: number;
	totalReviews: number;
	avgRating: number;
}

interface AdvancedStats {
	totalOrders: number;
	totalReviews: number;
	totalTables: number;
	activeTables: number;
	avgRating: number;
	totalRevenue: number;
	ordersByState: { active: number; complete: number; reject: number; cancel: number };
	ratingDistribution: Array<{ star: number; count: number }>;
	recentOrders: Array<{
		_id: string;
		restaurantID: string;
		table: string;
		state: string;
		orderTotal: number;
		itemCount: number;
		createdAt: string;
	}>;
	recentReviews: Array<{
		_id: string;
		restaurantID: string;
		rating: number;
		comment?: string;
		createdAt: string;
	}>;
}

type TabType = "overview" | "restaurants" | "activity" | "analytics";

export default function SuperAdminPage() {
	const session = useSession();
	const router = useRouter();
	const [profiles, setProfiles] = useState<RestaurantProfile[]>([]);
	const [accounts, setAccounts] = useState<RestaurantAccount[]>([]);
	const [stats, setStats] = useState<PlatformStats | null>(null);
	const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [modalState, setModalState] = useState(false);
	const [formLoading, setFormLoading] = useState(false);
	const [seedLoading, setSeedLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<TabType>("overview");
	const [currentTime, setCurrentTime] = useState(new Date());
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (session.status === "unauthenticated") {
			router.replace("/");
		}
	}, [session, router]);

	if (session.status === "authenticated" && session.data?.role !== "superadmin") {
		return (
			<div className="accessDenied">
				<Icon code="f071" type="solid" size={48} />
				<h2>Access Denied</h2>
				<p>You must be a super admin to view this page.</p>
				<Button label="Logout" type="primary" onClick={() => router.push("/logout")} />
			</div>
		);
	}

	const fetchRestaurants = async () => {
		try {
			const res = await fetch("/api/superadmin/restaurants");
			const json = await res.json();
			if (res.ok) {
				setProfiles(json.data.profiles);
				setAccounts(json.data.accounts);

				const accs = json.data.accounts as RestaurantAccount[];
				setStats({
					totalRestaurants: accs.length,
					activeRestaurants: accs.filter((a) => a.accountActive).length,
					totalMenuItems: accs.reduce((sum, a) => sum + (a.menus?.length || 0), 0),
					totalTables: accs.reduce((sum, a) => sum + (a.tables?.length || 0), 0),
					totalOrders: 0,
					totalReviews: 0,
					avgRating: 0,
				});
			} else {
				toast.error(json.message || "Failed to load restaurants");
			}
		} catch {
			toast.error("Error loading data");
		} finally {
			setLoading(false);
		}
	};

	const fetchAdvancedStats = async () => {
		try {
			const res = await fetch("/api/superadmin/stats");
			const json = await res.json();
			if (res.ok) {
				setAdvancedStats(json.data);
			}
		} catch {
			// silent fail for stats
		}
	};

	useEffect(() => {
		if (session.status === "authenticated" && session.data?.role === "superadmin") {
			fetchRestaurants();
			fetchAdvancedStats();
		}
	}, [session.status, session.data?.role]);

	const onCreateRestaurant = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormLoading(true);
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		try {
			const req = await fetch("/api/superadmin/restaurants", {
				method: "POST",
				body: JSON.stringify(data),
				headers: { "Content-Type": "application/json" },
			});
			const res = await req.json();
			if (req.ok) {
				toast.success(res.message || "Restaurant Added");
				fetchRestaurants();
				setModalState(false);
			} else {
				toast.error(res.message || "Error adding restaurant");
			}
		} catch {
			toast.error("Error adding restaurant");
		}
		setFormLoading(false);
	};

	const onSeedData = async () => {
		setSeedLoading(true);
		try {
			const res = await fetch("/api/seed");
			const json = await res.json();
			if (res.ok) {
				toast.success(`Seed successful! ${json.restaurants?.length || 0} restaurants created, ${json.reviewsCreated || 0} reviews generated.`);
				fetchRestaurants();
				fetchAdvancedStats();
			} else {
				toast.error(json.error || "Seed failed");
			}
		} catch {
			toast.error("Seed failed");
		}
		setSeedLoading(false);
	};

	const onToggleAccount = async (accountId: string, currentlyActive: boolean) => {
		setActionLoading(accountId);
		const action = currentlyActive ? "deactivate" : "activate";
		try {
			const req = await fetch(`/api/superadmin/restaurants/${accountId}`, {
				method: "PATCH",
				body: JSON.stringify({ action }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await req.json();
			if (req.ok) {
				toast.success(res.message || "Account updated");
				fetchRestaurants();
			} else {
				toast.error(res.message || "Error updating account");
			}
		} catch {
			toast.error("Error updating account");
		}
		setActionLoading(null);
	};

	const onRemoveAccount = async (accountId: string, name: string) => {
		if (!window.confirm(`Permanently remove "${name}"? This cannot be undone.`)) return;
		setActionLoading(accountId);
		try {
			const req = await fetch(`/api/superadmin/restaurants/${accountId}`, {
				method: "DELETE",
			});
			const res = await req.json();
			if (req.ok) {
				toast.success(res.message || "Restaurant removed");
				fetchRestaurants();
			} else {
				toast.error(res.message || "Error removing restaurant");
			}
		} catch {
			toast.error("Error removing restaurant");
		}
		setActionLoading(null);
	};

	const filteredAccounts = accounts.filter((a) => {
		const profile = profiles.find((p) => p.restaurantID === a.username);
		const q = searchQuery.toLowerCase();
		return a.username.includes(q) || a.email.includes(q) || (profile?.name || "").toLowerCase().includes(q);
	});

	const formatTimeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	};

	const stateLabel = (state: string) => {
		const map: Record<string, string> = { active: "Active", complete: "Completed", reject: "Rejected", cancel: "Cancelled" };
		return map[state] || state;
	};

	if (loading || session.status === "loading") {
		return (
			<div className="superadminViewport">
				<Spinner label="Loading Dashboard..." fullpage />
			</div>
		);
	}

	const maxRatingCount = advancedStats ? Math.max(...advancedStats.ratingDistribution.map((d) => d.count), 1) : 1;
	const orderTotal = advancedStats
		? advancedStats.ordersByState.active + advancedStats.ordersByState.complete + advancedStats.ordersByState.reject + advancedStats.ordersByState.cancel
		: 0;

	return (
		<div className="superadminViewport">
			{/* Header */}
			<div className="superadminHeader">
				<div className="headerLeft">
					<div className="brandMark">
						<Icon code="e533" type="solid" size={28} />
					</div>
					<div>
						<h1>Command Center</h1>
						<span className="headerSubtitle">
							OrderWorder Platform Management • {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
						</span>
					</div>
				</div>
				<div className="headerActions">
					<Button label="Seed Demo Data" type="secondary" icon="f5e1" iconType="solid" onClick={onSeedData} loading={seedLoading} />
					<Button label="Add Restaurant" icon="2b" iconType="solid" onClick={() => setModalState(true)} />
					<Button label="Logout" type="secondaryDanger" onClick={() => router.push("/logout")} icon="f011" iconType="solid" />
				</div>
			</div>

			{/* Tabs */}
			<div className="tabBar">
				<button type="button" className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
					<Icon code="e09f" type="solid" size={14} />
					Overview
				</button>
				<button type="button" className={`tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
					<Icon code="e473" type="solid" size={14} />
					Analytics
				</button>
				<button type="button" className={`tab ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>
					<Icon code="f1da" type="solid" size={14} />
					Activity
				</button>
				<button type="button" className={`tab ${activeTab === "restaurants" ? "active" : ""}`} onClick={() => setActiveTab("restaurants")}>
					<Icon code="f965" type="solid" size={14} />
					Restaurants
				</button>
			</div>

			{/* OVERVIEW TAB */}
			{activeTab === "overview" && (
				<>
					{/* Primary Stats Grid */}
					<div className="statsGrid">
						<div className="statCard accent">
							<div className="statCardIcon">
								<Icon code="f965" type="solid" size={22} />
							</div>
							<div className="statCardBody">
								<span className="statCardValue">{stats?.totalRestaurants ?? 0}</span>
								<span className="statCardLabel">Restaurants</span>
							</div>
						</div>
						<div className="statCard">
							<div className="statCardIcon green">
								<Icon code="f058" type="solid" size={22} />
							</div>
							<div className="statCardBody">
								<span className="statCardValue">{stats?.activeRestaurants ?? 0}</span>
								<span className="statCardLabel">Active</span>
							</div>
						</div>
						<div className="statCard">
							<div className="statCardIcon orange">
								<Icon code="e3e3" type="solid" size={22} />
							</div>
							<div className="statCardBody">
								<span className="statCardValue">{stats?.totalMenuItems ?? 0}</span>
								<span className="statCardLabel">Menu Items</span>
							</div>
						</div>
						<div className="statCard">
							<div className="statCardIcon blue">
								<Icon code="f0ce" type="solid" size={22} />
							</div>
							<div className="statCardBody">
								<span className="statCardValue">{stats?.totalTables ?? 0}</span>
								<span className="statCardLabel">Tables</span>
							</div>
						</div>
					</div>

					{/* Secondary Stats */}
					{advancedStats && (
						<div className="statsGrid secondary">
							<div className="statCard">
								<div className="statCardIcon teal">
									<Icon code="f291" type="solid" size={22} />
								</div>
								<div className="statCardBody">
									<span className="statCardValue">{advancedStats.totalOrders}</span>
									<span className="statCardLabel">Total Orders</span>
								</div>
							</div>
							<div className="statCard">
								<div className="statCardIcon gold">
									<Icon code="f005" type="solid" size={22} />
								</div>
								<div className="statCardBody">
									<span className="statCardValue">{advancedStats.avgRating || "—"}</span>
									<span className="statCardLabel">Avg Rating</span>
								</div>
							</div>
							<div className="statCard">
								<div className="statCardIcon pink">
									<Icon code="f4ad" type="solid" size={22} />
								</div>
								<div className="statCardBody">
									<span className="statCardValue">{advancedStats.totalReviews}</span>
									<span className="statCardLabel">Reviews</span>
								</div>
							</div>
							<div className="statCard">
								<div className="statCardIcon emerald">
									<Icon code="f155" type="solid" size={22} />
								</div>
								<div className="statCardBody">
									<span className="statCardValue">${advancedStats.totalRevenue.toLocaleString()}</span>
									<span className="statCardLabel">Revenue</span>
								</div>
							</div>
						</div>
					)}

					{/* Quick Actions */}
					<div className="sectionTitle">
						<h2>Quick Actions</h2>
					</div>
					<div className="quickActions">
						<div className="actionCard" onClick={() => setModalState(true)}>
							<div className="actionIcon">
								<Icon code="2b" type="solid" size={20} />
							</div>
							<h4>Add Restaurant</h4>
							<p>Register a new restaurant on the platform</p>
						</div>
						<div className="actionCard" onClick={onSeedData}>
							<div className="actionIcon seed">
								<Icon code="f5e1" type="solid" size={20} />
							</div>
							<h4>Seed Demo Data</h4>
							<p>Populate database with demo restaurants and menus</p>
						</div>
						<div className="actionCard" onClick={() => setActiveTab("restaurants")}>
							<div className="actionIcon view">
								<Icon code="f0ce" type="solid" size={20} />
							</div>
							<h4>Manage Restaurants</h4>
							<p>View and manage all registered restaurants</p>
						</div>
					</div>

					{/* Overview Table */}
					<div className="sectionTitle">
						<h2>Restaurant Overview</h2>
					</div>
					<div className="overviewTable">
						<table>
							<thead>
								<tr>
									<th>Restaurant</th>
									<th>Username</th>
									<th>Email</th>
									<th>Status</th>
									<th>Menus</th>
									<th>Tables</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{accounts.length === 0 ? (
									<tr>
										<td colSpan={7} className="emptyRow">
											No restaurants found. Add one or seed demo data.
										</td>
									</tr>
								) : (
									accounts.map((account) => {
										const profile = profiles.find((p) => p.restaurantID === account.username);
										return (
											<tr key={account._id}>
												<td className="nameCell">
													{profile?.avatar && <img src={profile.avatar} alt="" className="avatarThumb" />}
													<span>{profile?.name || "No Profile"}</span>
												</td>
												<td>
													<code>{account.username}</code>
												</td>
												<td>{account.email}</td>
												<td>
													<span className={`statusBadge ${account.accountActive ? "active" : "inactive"}`}>
														{account.accountActive ? "Active" : "Inactive"}
													</span>
												</td>
												<td>{account.menus?.length ?? 0}</td>
												<td>{account.tables?.length ?? 0}</td>
												<td>
													<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
														<a href={`/${account.username}?tab=menu`} target="_blank" rel="noreferrer">
															<Button label="Customer View" type="secondary" icon="f35d" iconType="solid" />
														</a>
														<a href={`/dashboard?tab=orders&restaurant=${account.username}`} target="_blank" rel="noreferrer">
															<Button label="Admin" type="primary" icon="e533" iconType="solid" />
														</a>
														<Button
															label={account.accountActive ? "Deactivate" : "Activate"}
															type={account.accountActive ? "secondaryDanger" : "primary"}
															icon={account.accountActive ? "f4c4" : "f4f9"}
															iconType="solid"
															loading={actionLoading === account._id}
															onClick={() => onToggleAccount(account._id, account.accountActive)}
														/>
														<Button
															label="Remove"
															type="secondaryDanger"
															icon="f2ed"
															iconType="solid"
															loading={actionLoading === account._id}
															onClick={() => onRemoveAccount(account._id, profile?.name || account.username)}
														/>
													</div>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</>
			)}

			{/* ANALYTICS TAB */}
			{activeTab === "analytics" && (
				<>
					{advancedStats ? (
						<div className="analyticsLayout">
							{/* Order Status Breakdown */}
							<div className="analyticsCard">
								<h3>
									<Icon code="f291" type="solid" size={16} /> Order Status Breakdown
								</h3>
								<div className="orderStatusGrid">
									<div className="orderStatusItem active">
										<div className="orderStatusCircle">
											<Icon code="f06a" type="solid" size={18} />
										</div>
										<span className="orderStatusCount">{advancedStats.ordersByState.active}</span>
										<span className="orderStatusLabel">Active</span>
									</div>
									<div className="orderStatusItem complete">
										<div className="orderStatusCircle">
											<Icon code="f058" type="solid" size={18} />
										</div>
										<span className="orderStatusCount">{advancedStats.ordersByState.complete}</span>
										<span className="orderStatusLabel">Completed</span>
									</div>
									<div className="orderStatusItem reject">
										<div className="orderStatusCircle">
											<Icon code="f057" type="solid" size={18} />
										</div>
										<span className="orderStatusCount">{advancedStats.ordersByState.reject}</span>
										<span className="orderStatusLabel">Rejected</span>
									</div>
									<div className="orderStatusItem cancel">
										<div className="orderStatusCircle">
											<Icon code="f05e" type="solid" size={18} />
										</div>
										<span className="orderStatusCount">{advancedStats.ordersByState.cancel}</span>
										<span className="orderStatusLabel">Cancelled</span>
									</div>
								</div>
								{orderTotal > 0 && (
									<div className="orderStatusBar">
										<div className="barSegment active" style={{ width: `${(advancedStats.ordersByState.active / orderTotal) * 100}%` }} />
										<div className="barSegment complete" style={{ width: `${(advancedStats.ordersByState.complete / orderTotal) * 100}%` }} />
										<div className="barSegment reject" style={{ width: `${(advancedStats.ordersByState.reject / orderTotal) * 100}%` }} />
										<div className="barSegment cancel" style={{ width: `${(advancedStats.ordersByState.cancel / orderTotal) * 100}%` }} />
									</div>
								)}
							</div>

							{/* Rating Distribution */}
							<div className="analyticsCard">
								<h3>
									<Icon code="f005" type="solid" size={16} /> Rating Distribution
								</h3>
								<div className="ratingOverview">
									<div className="ratingBigNumber">
										<span className="bigRating">{advancedStats.avgRating || "—"}</span>
										<div className="ratingStars">
											{[1, 2, 3, 4, 5].map((s) => (
												<Icon key={s} code="f005" type="solid" size={14} set={s <= Math.round(advancedStats.avgRating) ? "classic" : "duotone"} />
											))}
										</div>
										<span className="ratingCount">{advancedStats.totalReviews} reviews</span>
									</div>
									<div className="ratingBars">
										{advancedStats.ratingDistribution
											.slice()
											.reverse()
											.map((d) => (
												<div key={d.star} className="ratingRow">
													<span className="ratingLabel">
														{d.star} <Icon code="f005" type="solid" size={10} />
													</span>
													<div className="ratingTrack">
														<div className="ratingFill" style={{ width: `${(d.count / maxRatingCount) * 100}%` }} />
													</div>
													<span className="ratingNum">{d.count}</span>
												</div>
											))}
									</div>
								</div>
							</div>

							{/* Table Utilization */}
							<div className="analyticsCard compact">
								<h3>
									<Icon code="f0ce" type="solid" size={16} /> Table Utilization
								</h3>
								<div className="utilizationStats">
									<div className="utilizationMain">
										<span className="utilizationPercent">
											{advancedStats.totalTables > 0 ? Math.round((advancedStats.activeTables / advancedStats.totalTables) * 100) : 0}%
										</span>
										<span className="utilizationLabel">Active</span>
									</div>
									<div className="utilizationDetails">
										<div>
											<span className="utilDetailValue">{advancedStats.activeTables}</span>
											<span className="utilDetailLabel">Active Tables</span>
										</div>
										<div>
											<span className="utilDetailValue">{advancedStats.totalTables - advancedStats.activeTables}</span>
											<span className="utilDetailLabel">Inactive Tables</span>
										</div>
									</div>
								</div>
							</div>

							{/* Revenue Card */}
							<div className="analyticsCard compact">
								<h3>
									<Icon code="f155" type="solid" size={16} /> Revenue Summary
								</h3>
								<div className="revenueStats">
									<div className="revenueBig">${advancedStats.totalRevenue.toLocaleString()}</div>
									<span className="revenueLabel">From {advancedStats.ordersByState.complete} completed orders</span>
									{advancedStats.ordersByState.complete > 0 && (
										<span className="revenueAvg">
											Avg: ${Math.round(advancedStats.totalRevenue / advancedStats.ordersByState.complete).toLocaleString()} / order
										</span>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="emptyState">
							<Icon code="e473" type="solid" size={48} />
							<p>No analytics data available yet. Seed some demo data to get started.</p>
						</div>
					)}
				</>
			)}

			{/* ACTIVITY TAB */}
			{activeTab === "activity" && (
				<>
					<div className="activityLayout">
						{/* Recent Orders */}
						<div className="activityCard">
							<h3>
								<Icon code="f291" type="solid" size={16} /> Recent Orders
							</h3>
							{advancedStats?.recentOrders && advancedStats.recentOrders.length > 0 ? (
								<div className="activityList">
									{advancedStats.recentOrders.map((order) => (
										<div key={order._id} className="activityItem">
											<div className={`activityDot ${order.state}`} />
											<div className="activityContent">
												<div className="activityTop">
													<span className="activityTitle">
														<strong>{order.restaurantID}</strong> • Table {order.table}
													</span>
													<span className="activityTime">{formatTimeAgo(order.createdAt)}</span>
												</div>
												<div className="activityBottom">
													<span
														className={`statusBadge ${order.state === "complete" ? "active" : order.state === "active" ? "pending" : "inactive"}`}>
														{stateLabel(order.state)}
													</span>
													<span className="activityMeta">
														{order.itemCount} items • ${order.orderTotal?.toFixed(2) || "0.00"}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="activityEmpty">
									<Icon code="f291" type="solid" size={32} />
									<p>No recent orders</p>
								</div>
							)}
						</div>

						{/* Recent Reviews */}
						<div className="activityCard">
							<h3>
								<Icon code="f005" type="solid" size={16} /> Recent Reviews
							</h3>
							{advancedStats?.recentReviews && advancedStats.recentReviews.length > 0 ? (
								<div className="activityList">
									{advancedStats.recentReviews.map((review) => (
										<div key={review._id} className="activityItem">
											<div className="activityDot review" />
											<div className="activityContent">
												<div className="activityTop">
													<span className="activityTitle">
														<strong>{review.restaurantID}</strong>
													</span>
													<span className="activityTime">{formatTimeAgo(review.createdAt)}</span>
												</div>
												<div className="reviewStarsRow">
													{[1, 2, 3, 4, 5].map((s) => (
														<Icon key={s} code="f005" type="solid" size={12} set={s <= review.rating ? "classic" : "duotone"} />
													))}
												</div>
												{review.comment && <p className="activityComment">{review.comment}</p>}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="activityEmpty">
									<Icon code="f005" type="solid" size={32} />
									<p>No recent reviews</p>
								</div>
							)}
						</div>
					</div>

					{/* System Health */}
					<div className="sectionTitle" style={{ marginTop: 24 }}>
						<h2>System Health</h2>
					</div>
					<div className="healthGrid">
						<div className="healthCard">
							<div className="healthIndicator online" />
							<div>
								<h4>Database</h4>
								<span>Connected</span>
							</div>
						</div>
						<div className="healthCard">
							<div className="healthIndicator online" />
							<div>
								<h4>API Server</h4>
								<span>Operational</span>
							</div>
						</div>
						<div className="healthCard">
							<div className="healthIndicator online" />
							<div>
								<h4>Auth Service</h4>
								<span>Active</span>
							</div>
						</div>
						<div className="healthCard">
							<div className={`healthIndicator ${(advancedStats?.activeTables ?? 0) > 0 ? "online" : "idle"}`} />
							<div>
								<h4>Active Tables</h4>
								<span>{advancedStats?.activeTables ?? 0} live</span>
							</div>
						</div>
					</div>
				</>
			)}

			{/* RESTAURANTS TAB */}
			{activeTab === "restaurants" && (
				<>
					<div className="searchBar">
						<Icon code="f002" type="solid" size={14} />
						<input
							type="text"
							placeholder="Search restaurants by name, username, or email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<div className="restaurantGrid">
						{filteredAccounts.length === 0 ? (
							<div className="emptyState">
								<Icon code="f965" type="solid" size={48} />
								<p>{searchQuery ? "No restaurants match your search." : "No restaurants found. Add one or seed demo data."}</p>
							</div>
						) : (
							filteredAccounts.map((account) => {
								const profile = profiles.find((p) => p.restaurantID === account.username);
								return (
									<div key={account._id} className="restaurantCard">
										{profile?.cover && <div className="cardCover" style={{ backgroundImage: `url(${profile.cover})` }} />}
										<div className="cardBody">
											<div className="cardHeader">
												{profile?.avatar && <img src={profile.avatar} alt="" className="cardAvatar" />}
												<div>
													<h3>{profile?.name || "No Profile"}</h3>
													<span className="cardUsername">@{account.username}</span>
												</div>
											</div>
											{profile?.description && <p className="cardDesc">{profile.description}</p>}
											<div className="cardMeta">
												<span>
													<Icon code="f0e0" type="solid" size={11} /> {account.email}
												</span>
												{profile?.address && (
													<span>
														<Icon code="f3c5" type="solid" size={11} /> {profile.address}
													</span>
												)}
											</div>
											{profile?.categories && profile.categories.length > 0 && (
												<div className="cardTags">
													{profile.categories.slice(0, 5).map((cat, i) => (
														<span key={i} className="tag">
															{cat}
														</span>
													))}
													{profile.categories.length > 5 && <span className="tag more">+{profile.categories.length - 5}</span>}
												</div>
											)}
											<div className="cardFooter">
												<div className="cardStats">
													<span>
														<Icon code="e3e3" type="solid" size={11} /> {account.menus?.length ?? 0} items
													</span>
													<span>
														<Icon code="f0ce" type="solid" size={11} /> {account.tables?.length ?? 0} tables
													</span>
												</div>
												<span className={`statusBadge ${account.accountActive ? "active" : "inactive"}`}>
													{account.accountActive ? "Active" : "Inactive"}
												</span>
											</div>
										</div>
										<div className="cardActions">
											<a href={`/${account.username}?tab=menu`} target="_blank" rel="noreferrer">
												<Button label="Customer View" type="secondary" icon="f35d" iconType="solid" />
											</a>
											<a href={`/dashboard?tab=orders&restaurant=${account.username}`} target="_blank" rel="noreferrer">
												<Button label="Admin" type="primary" icon="e533" iconType="solid" />
											</a>
											<Button
												label={account.accountActive ? "Deactivate" : "Activate"}
												type={account.accountActive ? "secondaryDanger" : "primary"}
												icon={account.accountActive ? "f4c4" : "f4f9"}
												iconType="solid"
												loading={actionLoading === account._id}
												onClick={() => onToggleAccount(account._id, account.accountActive)}
											/>
											<Button
												label="Remove"
												type="secondaryDanger"
												icon="f2ed"
												iconType="solid"
												loading={actionLoading === account._id}
												onClick={() => onRemoveAccount(account._id, profile?.name || account.username)}
											/>
										</div>
									</div>
								);
							})
						)}
					</div>
				</>
			)}

			{/* Create Restaurant Modal */}
			{modalState && (
				<div className="modalOverlay" onClick={() => setModalState(false)}>
					<div className="modalContainer" onClick={(e) => e.stopPropagation()}>
						<div className="modalHeader">
							<h3>Add New Restaurant</h3>
							<button type="button" className="modalClose" onClick={() => setModalState(false)}>
								<Icon code="f00d" type="solid" size={16} />
							</button>
						</div>
						<form onSubmit={onCreateRestaurant} className="modalForm">
							<div className="formGroup">
								<label>Restaurant Name</label>
								<input name="name" required placeholder="e.g. Golden Gate" />
							</div>
							<div className="formGroup">
								<label>Global Username</label>
								<input name="username" required placeholder="e.g. goldengate" />
							</div>
							<div className="formRow">
								<div className="formGroup">
									<label>Owner Email</label>
									<input name="email" type="email" required placeholder="owner@restaurant.com" />
								</div>
								<div className="formGroup">
									<label>Admin Password</label>
									<input name="password" type="password" required />
								</div>
							</div>
							<div className="formGroup">
								<label>Description (optional)</label>
								<input name="description" placeholder="Brief description of the restaurant" />
							</div>
							<div className="formGroup">
								<label>Address (optional)</label>
								<input name="address" placeholder="City, Country" />
							</div>
							<div className="modalActions">
								<Button label="Cancel" type="secondary" onClick={() => setModalState(false)} />
								<Button label="Create Restaurant" type="primary" htmlType="submit" loading={formLoading} />
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
