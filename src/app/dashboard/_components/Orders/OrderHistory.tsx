import clsx from "clsx";
import { type UIEvent, useEffect, useMemo, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import NoContent from "#components/layout/NoContent";
import "./ordersCard.scss";
import "./orderHistory.scss";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateKey = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ─── Inline calendar ─────────────────────────────────────────────────────────

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const HistoryCalendar = ({
	allSessions,
	selectedDate,
	onSelect,
}: {
	allSessions: any[];
	selectedDate: string | null;
	onSelect: (date: string | null) => void;
}) => {
	const [calStart, setCalStart] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});

	const year = calStart.getFullYear();
	const month = calStart.getMonth();

	const sessionDates = useMemo(() => {
		const s = new Set<string>();
		for (const session of allSessions) {
			if (session.startTime) s.add(toDateKey(new Date(session.startTime)));
		}
		return s;
	}, [allSessions]);

	const todayKey = toDateKey(new Date());
	const firstDow = new Date(year, month, 1).getDay();
	const startOffset = (firstDow + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const prevMonth = () => setCalStart(new Date(year, month - 1, 1));
	const nextMonth = () => setCalStart(new Date(year, month + 1, 1));
	const monthLabel = calStart.toLocaleString(undefined, { month: "long", year: "numeric" });

	return (
		<div className="historyCalendar">
			<div className="historyCalendar__nav">
				<button type="button" className="historyCalendar__navBtn" onClick={prevMonth}>
					‹
				</button>
				<span className="historyCalendar__monthLabel">{monthLabel}</span>
				<button type="button" className="historyCalendar__navBtn" onClick={nextMonth}>
					›
				</button>
			</div>
			<div className="historyCalendar__weekRow">
				{WEEK_DAYS.map((d) => (
					<span key={d} className="historyCalendar__weekDay">
						{d}
					</span>
				))}
			</div>
			<div className="historyCalendar__grid">
				{Array.from({ length: startOffset }).map((_, i) => (
					<span key={`e${i}`} className="historyCalendar__empty" />
				))}
				{Array.from({ length: daysInMonth }).map((_, i) => {
					const day = i + 1;
					const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
					const hasSession = sessionDates.has(key);
					const isToday = key === todayKey;
					const isSelected = key === selectedDate;

					return (
						<button
							key={key}
							type="button"
							className={clsx(
								"historyCalendar__day",
								hasSession && "has-session",
								isToday && "today",
								isSelected && "selected",
								!hasSession && "no-session",
							)}
							onClick={() => onSelect(isSelected ? null : key)}
						>
							{day}
						</button>
					);
				})}
			</div>
			{selectedDate && (
				<button type="button" className="historyCalendar__clear" onClick={() => onSelect(null)}>
					✕ Clear date filter
				</button>
			)}
		</div>
	);
};

// ─── Left nav date item ───────────────────────────────────────────────────────

const DateCard = ({ dateStr, sessionCount, active, activate }: any) => (
	<button type="button" className={clsx("historyDateCard", active && "active")} onClick={activate}>
		<span className="historyDateCard__date">{dateStr}</span>
		<span className="historyDateCard__badge">{sessionCount}</span>
	</button>
);

// ─── Cards ───────────────────────────────────────────────────────────────────

const OrderCard = ({ order, session, index, reviews = [], staffCalls = [], globalIndex }: any) => {
	const startStr = new Date(order?.createdAt || session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	const orderTotal = order?.orderTotal || order?.products?.reduce((s: number, p: any) => s + p.price * p.quantity, 0) || 0;
	const itemCount = order?.products?.reduce((s: number, p: any) => s + p.quantity, 0) || 0;

	return (
		<div className="orderCard" style={{ height: "auto", animationDelay: `${globalIndex * 50}ms` }}>
			<div className="orderCard__accent" />
			<div className="orderCard__header">
				<div className="orderCard__headerLeft">
					<p className="orderCard__title">{order ? `Order #${index + 1}` : "Session Activity"}</p>
					<p className="orderCard__meta">
						🪑 {session.tableName} · {startStr}
					</p>
				</div>
				{order ? (
					<div className="orderCard__badge">
						{itemCount} item{itemCount !== 1 ? "s" : ""}
					</div>
				) : null}
			</div>
			
			<div className="orderCard__body" style={{ gap: "0" }}>
				{/* Orders Section */}
				{order?.products?.length > 0 && (
					<div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "12px" }}>
						{order.products.map((item: any, i: number) => (
							<div key={i} className="orderCard__row">
								<span className="orderCard__itemName">
									{item.name}
									<span className="orderCard__qty">×{item.quantity}</span>
								</span>
								<span className="orderCard__itemPrice birr">{(item.price * item.quantity).toFixed(2)}</span>
							</div>
						))}
					</div>
				)}

				{/* Staff Calls Section */}
				{staffCalls.map((call: any, idx: number) => {
					const callTime = new Date(call.createdAt || session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
					return (
						<div key={`call-${idx}`} style={{ borderTop: (order?.products?.length || idx > 0) ? "1px dashed var(--borderLighter)" : "none", padding: "12px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
							<span style={{ fontSize: "13px", fontWeight: "bold", color: "#e74c3c", display: "flex", alignItems: "center", gap: "6px" }}>
								🛎️ Staff Call
								<span style={{ fontSize: "11px", fontWeight: "normal", color: "#888", marginLeft: "auto" }}>{callTime}</span>
							</span>
							<span style={{ fontSize: "13px", color: "var(--colorContentPrimary)" }}>Reason: {call.reason}</span>
						</div>
					);
				})}

				{/* Reviews Section */}
				{reviews.map((review: any, idx: number) => {
					const revTime = new Date(review.createdAt || session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
					return (
						<div key={`rev-${idx}`} style={{ borderTop: (order?.products?.length || staffCalls.length > 0 || idx > 0) ? "1px dashed var(--borderLighter)" : "none", padding: "12px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
							<span style={{ fontSize: "13px", fontWeight: "bold", color: "#f39c12", display: "flex", alignItems: "center", gap: "6px" }}>
								⭐ Review ({review.rating}/5)
								<span style={{ fontSize: "11px", fontWeight: "normal", color: "#888", marginLeft: "auto" }}>{revTime}</span>
							</span>
							<span style={{ fontSize: "13px", fontStyle: "italic", opacity: 0.9 }}>"{review.comment || "No comment provided."}"</span>
						</div>
					);
				})}
			</div>
			
			{order ? (
				<div className="orderCard__footer">
					<span>Total</span>
					<span className="birr">{orderTotal.toFixed(2)}</span>
				</div>
			) : (
				<div className="orderCard__footer" style={{ borderTop: "none", background: "transparent", padding: "0 16px 12px" }}></div>
			)}
		</div>
	);
};

// ─── Main component ───────────────────────────────────────────────────────────

const OrderHistory = (props: TOrderHistoryProps) => {
	const { onScroll } = props;
	const { orderHistory = [] } = useAdmin();
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	// 1. Deduplicate sessions by sessionId
	const deduped = useMemo(() => {
		const map: Record<string, any> = {};
		for (const session of orderHistory as any[]) {
			const key = session.sessionId || session._id?.toString();
			if (!key) continue;
			const existing = map[key];
			if (!existing) {
				map[key] = session;
			} else {
				const existingClosed = Boolean(existing.endTime);
				const newClosed = Boolean(session.endTime);
				if (!existingClosed && newClosed) {
					map[key] = session;
				} else if (existingClosed === newClosed && new Date(session.updatedAt) > new Date(existing.updatedAt)) {
					map[key] = session;
				}
			}
		}
		return Object.values(map);
	}, [orderHistory]);

	// 2. Calendar filter
	const filtered = useMemo(() => {
		if (!selectedDate) return deduped;
		return deduped.filter((s: any) => toDateKey(new Date(s.startTime)) === selectedDate);
	}, [deduped, selectedDate]);

	// 3. Group by table
	const groupedByTable = useMemo(
		() =>
			filtered.reduce((acc: any, session: any) => {
				const tName = session.tableName || session.table || "Unknown Table";
				if (!acc[tName]) acc[tName] = [];
				acc[tName].push(session);
				return acc;
			}, {}),
		[filtered],
	);

	const sortedTableNames = Object.keys(groupedByTable).sort();
	const [activeGroupKey, setActiveGroupKey] = useState<string>();

	useEffect(() => {
		if (filtered.length === 0) {
			setActiveGroupKey(undefined);
			return;
		}
		const isValid = activeGroupKey && groupedByTable[activeGroupKey];
		if (!isValid) {
			const firstTable = sortedTableNames[0];
			if (firstTable) {
				setActiveGroupKey(firstTable);
			}
		}
	}, [filtered, groupedByTable, sortedTableNames, activeGroupKey]);

	useEffect(() => {
		if (selectedDate && sortedTableNames.length > 0) {
			const firstTable = sortedTableNames[0];
			if (firstTable) setActiveGroupKey(firstTable);
		}
	}, [selectedDate]);

	const activeTable = activeGroupKey;
	const activeSessions = (activeTable && groupedByTable[activeTable]) || [];

	// 4. Distribute reviews & staff calls into individual order cards.
	const orderCards = useMemo(() => {
		const sortedSessions = [...activeSessions].sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
		const cards: any[] = [];
		for (const session of sortedSessions) {
			const orders = [...(session.orders || [])].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
			const reviews = [...(session.reviews || [])];
			const staffCalls = [...(session.staffCalls || [])];
			
			orders.forEach((order: any, idx: number) => {
				const orderTime = new Date(order.createdAt).getTime();
				const nextOrderTime = orders[idx + 1] ? new Date(orders[idx + 1].createdAt).getTime() : Infinity;
				
				const orderReviews = reviews.filter(r => {
					const t = new Date(r.createdAt || session.startTime).getTime();
					return t >= orderTime && t < nextOrderTime;
				});
				const orderStaffCalls = staffCalls.filter(c => {
					const t = new Date(c.createdAt || session.startTime).getTime();
					return t >= orderTime && t < nextOrderTime;
				});

				if (idx === 0) {
					orderReviews.push(...reviews.filter(r => new Date(r.createdAt || session.startTime).getTime() < orderTime));
					orderStaffCalls.push(...staffCalls.filter(c => new Date(c.createdAt || session.startTime).getTime() < orderTime));
				}
				
				cards.push({ order, session, index: idx, reviews: orderReviews, staffCalls: orderStaffCalls, time: orderTime });
			});
			
			if (orders.length === 0 && (reviews.length > 0 || staffCalls.length > 0)) {
				cards.push({ order: null, session, index: 0, reviews, staffCalls, time: new Date(session.startTime).getTime() });
			}
		}
		return cards.sort((a, b) => b.time - a.time);
	}, [activeSessions]);

	return (
		<div className="orders">
			{orderHistory.length === 0 ? (
				<NoContent label="No history found" animationName="GhostNoContent" />
			) : (
				<div className="ordersContent">
					{/* Left nav */}
					<div className="list historyNav" onScroll={onScroll}>
						<HistoryCalendar allSessions={deduped} selectedDate={selectedDate} onSelect={setSelectedDate} />
						{sortedTableNames.length === 0 ? (
							<p className="historyNav__empty">{selectedDate ? "No sessions on this date" : "No sessions found"}</p>
						) : (
							sortedTableNames.map((tableName) => {
								const sessionsArr = groupedByTable[tableName];
								const totalSessions = sessionsArr.length;
								const isActive = activeGroupKey === tableName;
								return (
									<button
										key={tableName}
										type="button"
										className={clsx("historyDateCard", isActive && "active")}
										style={{ marginBottom: "8px" }}
										onClick={() => setActiveGroupKey(tableName)}
									>
										<span className="historyNav__tableName" style={{ opacity: isActive ? 1 : 0.65 }}>{tableName}</span>
										<span className="historyDateCard__badge">{totalSessions}</span>
									</button>
								);
							})
						)}
					</div>

					{/* Right grid — merged session cards */}
					<div className="details historyGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", alignContent: "flex-start", gap: "16px", padding: "20px", overflowY: "auto" }}>
						{!orderCards.length ? (
							<NoContent label="No history to show" animationName="GhostNoContent" size={200} />
						) : (
							orderCards.map((cardData, i) => (
								<OrderCard key={cardData.order?._id || `session-${cardData.session._id}-${i}`} {...cardData} globalIndex={i} />
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default OrderHistory;

export type TOrderHistoryProps = {
	onScroll: (event: UIEvent<HTMLDivElement>) => void;
};
