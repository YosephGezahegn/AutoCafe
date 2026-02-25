import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";

const OrderSettings = () => {
	const { profile, profileMutate } = useAdmin();
	const [loading, setLoading] = useState(false);
	const [requireLogin, setRequireLogin] = useState(profile?.requireCustomerLogin ?? false);

	const isChanged = requireLogin !== (profile?.requireCustomerLogin ?? false);

	const onSave = async () => {
		setLoading(true);
		try {
			const req = await fetch("/api/admin/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ requireCustomerLogin: requireLogin }),
			});
			const res = await req.json();
			if (req.ok) {
				toast.success("Settings saved successfully");
				await profileMutate();
			} else {
				toast.error(res?.message || "Failed to save settings");
			}
		} catch {
			toast.error("Failed to save settings");
		}
		setLoading(false);
	};

	return (
		<div className="themeSettings" style={{ padding: "20px" }}>
			<div className="colorHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
				<h1 className="heading" style={{ fontSize: "1.2rem" }}>
					Order <span>Settings</span>
				</h1>
				{isChanged && (
					<div className="action" style={{ display: "flex", gap: "10px" }}>
						<Button
							className="clear"
							type="secondaryDanger"
							onClick={() => setRequireLogin(profile?.requireCustomerLogin ?? false)}
							disabled={loading}
							label="Cancel"
						/>
						<Button className="save" type="primary" onClick={onSave} loading={loading} label="Save" />
					</div>
				)}
			</div>
			<div
				style={{
					backgroundColor: "var(--theme-bg, #fff)",
					padding: "15px",
					borderRadius: "10px",
					border: "1px solid var(--theme-border, #ddd)",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}>
				<div>
					<h3 style={{ fontSize: "1rem", marginBottom: "5px" }}>Require Customer Login</h3>
					<p style={{ fontSize: "0.85rem", color: "var(--theme-text-light, #666)" }}>
						If turned off, customers will not be asked for their phone number and name when checking out via QR code.
					</p>
				</div>
				<div style={{ display: "flex", gap: "10px" }}>
					<Button type={requireLogin ? "primary" : "secondary"} label="Yes" onClick={() => setRequireLogin(true)} />
					<Button type={requireLogin ? "secondary" : "primary"} label="No" onClick={() => setRequireLogin(false)} />
				</div>
			</div>
		</div>
	);
};

export default OrderSettings;
