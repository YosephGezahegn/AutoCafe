"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "#components/context/LanguageContext";
import { useRestaurant } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";

import ContactPage from "./Menu/ContactPage";
import OrderPage from "./Menu/OrderPage";
import OrderSummaryPage from "./Menu/OrderSummaryPage";
import ReviewsPage from "./Menu/ReviewsPage";

type TMenuCustom = TMenu & { quantity: number };

export default function PageContainer() {
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");

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
	const { restaurant } = useRestaurant();
	const { t } = useLanguage();

	const tableParam = searchParams.get("table");
	const tableData = restaurant?.tables?.find((t) => t.username === tableParam);
	const [claimError, setClaimError] = useState("");

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
		</div>
	);
}
