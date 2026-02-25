import { useState } from "react";
import { Button, Icon } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";
import NoContent from "#components/layout/NoContent";

const StaffCalls = () => {
	const { staffCalls = [], resolveStaffCall } = useAdmin();
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const handleResolve = async (id: string) => {
		setLoadingItem(id);
		await resolveStaffCall(id);
		setLoadingItem(null);
	};

	return (
		<div className="orders" style={{ padding: "20px", paddingTop: "calc(var(--initialHeaderHeight) + 20px)", overflowY: "auto" }}>
			{staffCalls.length === 0 ? (
				<NoContent label="No pending staff calls" animationName="GhostNoContent" />
			) : (
				<div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
					{staffCalls.map((call) => (
						<div
							key={call._id?.toString()}
							style={{
								padding: "20px",
								backgroundColor: "var(--theme-bg, #fff)",
								borderRadius: "12px",
								border: "1px solid var(--theme-border, #eee)",
								display: "flex",
								flexDirection: "column",
								gap: "10px",
							}}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<h3 style={{ margin: 0, fontSize: "1.2rem" }}>{call.tableName || call.table}</h3>
								<Icon code="f0f3" size={24} style={{ color: "var(--theme-color, #f00)" }} />
							</div>
							{call.customer && (
								<p style={{ margin: 0, color: "var(--theme-text, #333)", fontSize: "0.95rem", fontWeight: 600 }}>
									Customer: {call.customer.fname} {call.customer.lname}
								</p>
							)}
							<p style={{ margin: 0, color: "var(--theme-text-light, #666)", fontSize: "0.95rem" }}>
								Requires: <strong>{call.reason}</strong>
							</p>
							<p style={{ margin: 0, color: "#aaa", fontSize: "0.85rem" }}>
								{new Date(call.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
							</p>
							<Button
								label={loadingItem === call._id?.toString() ? "Resolving..." : "Mark as Resolved"}
								type="primary"
								onClick={() => handleResolve(call._id?.toString() as string)}
								loading={loadingItem === call._id?.toString()}
								style={{ marginTop: "10px" }}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default StaffCalls;
