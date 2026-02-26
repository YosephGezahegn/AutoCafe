"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Icon } from "xtreme-ui";
import { useLanguage } from "#components/context/LanguageContext";
import { useRestaurant } from "#components/context/useContext";
import Modal from "#components/layout/Modal";
import type { TMenu } from "#utils/database/models/menu";

import ContactPage from "./Menu/ContactPage";
import OrderPage from "./Menu/OrderPage";
import OrderSummaryPage from "./Menu/OrderSummaryPage";
import ReviewsPage from "./Menu/ReviewsPage";

type TMenuCustom = TMenu & { quantity: number };

export default function PageContainer() {
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");
	const session = useSession();
	const { t } = useLanguage();
	const { restaurant } = useRestaurant();

	const [selectedProducts, setSelectedProducts] = useState<Array<TMenuCustom>>([]);

	const increaseProductQuantity = useCallback((product: TMenuCustom) => {
		setSelectedProducts((prev) => {
			const existing = prev.find((p) => p._id === product._id);
			if (existing) {
				return prev.map((p) => (p._id === product._id ? ({ ...p, quantity: p.quantity + 1 } as TMenuCustom) : p));
			}
			return [...prev, { ...product, quantity: 1 } as TMenuCustom];
		});
	}, []);

	const decreaseProductQuantity = useCallback((product: TMenuCustom) => {
		setSelectedProducts((prev) => {
			const updated = prev.map((p) => (p._id === product._id ? ({ ...p, quantity: p.quantity - 1 } as TMenuCustom) : p)).filter((p) => p.quantity > 0);
			return updated;
		});
	}, []);

	const resetSelectedProducts = useCallback(() => setSelectedProducts([]), []);

	const tableParam = searchParams.get("table");
	const tableData = restaurant?.tables?.find((t) => t.username === tableParam);
	const [claimError, setClaimError] = useState("");

	// Call Staff state
	const [callStaffOpen, setCallStaffOpen] = useState(false);
	const [callStaffLoading, setCallStaffLoading] = useState(false);
	const [callStaffCooldown, setCallStaffCooldown] = useState(false);

	const showOrderButton = restaurant?.tables?.some((t) => t.username === tableParam && t.isActive);
	const eligibleToOrder = showOrderButton && (!session.data || session.data?.role === "customer");

	const handleCallStaff = async (reason: string) => {
		if (callStaffCooldown) return;
		setCallStaffLoading(true);
		try {
			const res = await fetch("/api/table/call-staff", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ table: tableParam, restaurantID: restaurant?.username, reason }),
			});
			const json = await res.json();
			if (res.ok) {
				toast.success(json.message || "Staff has been notified!");
				setCallStaffOpen(false);
				setCallStaffCooldown(true);
				setTimeout(() => setCallStaffCooldown(false), 30000);
			} else {
				toast.error(json.message || "Failed to call staff.");
			}
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setCallStaffLoading(false);
		}
	};

	useEffect(() => {
		if (typeof window === "undefined" || !tableData?.isActive || !restaurant?.username || !tableParam) return;

		let sid = localStorage.getItem(`table_session_${tableParam}`);
		if (!sid) {
			sid = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
			localStorage.setItem(`table_session_${tableParam}`, sid);
		}

		fetch("/api/table/claim", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ table: tableParam, restaurantID: restaurant.username, sessionId: sid }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === 403 && data.message.includes("use by another person")) {
					setClaimError(data.message);
				}
			})
			.catch(() => {});
	}, [tableParam, tableData?.isActive, restaurant?.username]);

	if (claimError) {
		return (
			<div className="pageContainer">
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						padding: "20px",
						textAlign: "center",
					}}>
					<h2>{t("Table In Use")}</h2>
					<p>{t(claimError)}</p>
				</div>
			</div>
		);
	}

	if (tableParam && tableData && !tableData.isActive) {
		return (
			<div className="pageContainer">
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						padding: "20px",
						textAlign: "center",
						gap: "16px",
					}}>
					<div
						style={{
							width: "120px",
							height: "120px",
							borderRadius: "50%",
							background: "var(--themeP)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							marginBottom: "8px",
							position: "relative",
						}}>
						<span
							style={{
								fontSize: "48px",
								fontWeight: 800,
								color: "var(--themeC)",
								lineHeight: 1,
							}}>
							{tableData.name}
						</span>
						<div
							style={{
								position: "absolute",
								bottom: "-4px",
								right: "-4px",
								width: "36px",
								height: "36px",
								borderRadius: "50%",
								background: "var(--themeS)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								border: "3px solid var(--bg1)",
								fontSize: "16px",
							}}>
							🔒
						</div>
					</div>
					<h2 style={{ margin: 0, fontSize: "20px" }}>{t("Table is locked")}</h2>
					<p style={{ margin: 0, opacity: 0.7, fontSize: "14px", maxWidth: "280px" }}>
						{t("Please request staff to activate this table to start ordering.")}
					</p>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginTop: "8px",
							padding: "8px 16px",
							borderRadius: "20px",
							background: "var(--themeP)",
							fontSize: "13px",
							opacity: 0.8,
						}}>
						<span
							style={{
								width: "8px",
								height: "8px",
								borderRadius: "50%",
								background: "#f59e0b",
								animation: "pulse 1.5s ease-in-out infinite",
							}}
						/>
						{t("Waiting for activation...")}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="pageContainer">
			{tab === "order-summary" && (
				<OrderSummaryPage
					selectedProducts={selectedProducts}
					increaseProductQuantity={increaseProductQuantity}
					decreaseProductQuantity={decreaseProductQuantity}
					resetSelectedProducts={resetSelectedProducts}
					onFinishOrdering={resetSelectedProducts}
				/>
			)}
			{tab === "menu" && (
				<OrderPage
					selectedProducts={selectedProducts}
					increaseProductQuantity={increaseProductQuantity}
					decreaseProductQuantity={decreaseProductQuantity}
					resetSelectedProducts={resetSelectedProducts}
				/>
			)}
			{tab === "reviews" && <ReviewsPage />}
			{tab === "contact" && <ContactPage />}

			{/* Call Staff Button – visible on all tabs */}
			{eligibleToOrder && (
				<>
					<button
						type="button"
						className={`callStaffFab ${callStaffCooldown ? "cooldown" : ""}`}
						onClick={() => !callStaffCooldown && setCallStaffOpen(true)}
						title={callStaffCooldown ? t("Staff notified — please wait") : t("Call Staff")}>
						<Icon code="f0f3" type="solid" size={20} />
						{callStaffCooldown && <span className="cooldownDot" />}
					</button>
					<Modal open={callStaffOpen} setOpen={setCallStaffOpen} closeIcon="">
						<div className="callStaffModal">
							<div className="callStaffHeader">
								<div className="callStaffIcon">
									<Icon code="f0f3" type="solid" size={28} />
								</div>
								<h2>{t("Call Staff")}</h2>
								<p>{t("How can we help you?")}</p>
							</div>
							<div className="callStaffOptions">
								<button type="button" className="callOption" onClick={() => handleCallStaff("Order more food")} disabled={callStaffLoading}>
									<Icon code="e3e3" type="solid" size={22} />
									<span>{t("Order More")}</span>
									<small>{t("I'd like to add items")}</small>
								</button>
								<button type="button" className="callOption" onClick={() => handleCallStaff("Need assistance")} disabled={callStaffLoading}>
									<Icon code="f059" type="solid" size={22} />
									<span>{t("Need Help")}</span>
									<small>{t("I have a question")}</small>
								</button>
								<button type="button" className="callOption" onClick={() => handleCallStaff("Check / Bill please")} disabled={callStaffLoading}>
									<Icon code="f09d" type="solid" size={22} />
									<span>{t("Check Please")}</span>
									<small>{t("Ready to pay")}</small>
								</button>
								<button type="button" className="callOption" onClick={() => handleCallStaff("Other request")} disabled={callStaffLoading}>
									<Icon code="f2a1" type="solid" size={22} />
									<span>{t("Other")}</span>
									<small>{t("Something else")}</small>
								</button>
							</div>
							<button type="button" className="callStaffCancel" onClick={() => setCallStaffOpen(false)}>
								{t("Cancel")}
							</button>
						</div>
					</Modal>
				</>
			)}
		</div>
	);
}

