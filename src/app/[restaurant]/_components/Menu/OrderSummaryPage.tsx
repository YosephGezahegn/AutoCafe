"use client";

import pick from "lodash/pick";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Icon, Lottie } from "xtreme-ui";
import { useLanguage } from "#components/context/LanguageContext";
import { useRestaurant } from "#components/context/useContext";
import { getAnimSrc } from "#utils/constants/common";
import type { TMenu } from "#utils/database/models/menu";
import { useQueryParams } from "#utils/hooks/useQueryParams";

import "./orderSummaryPage.scss";

type TMenuCustom = TMenu & { quantity: number };

type TOrderSummaryPageProps = {
	selectedProducts: Array<TMenuCustom>;
	increaseProductQuantity: (product: TMenuCustom) => void;
	decreaseProductQuantity: (product: TMenuCustom) => void;
	resetSelectedProducts: () => void;
	onFinishOrdering: () => void;
};

const OrderSummaryPage = (props: TOrderSummaryPageProps) => {
	const { selectedProducts, increaseProductQuantity, decreaseProductQuantity, resetSelectedProducts } = props;
	const params = useQueryParams();
	const session = useSession();
	const { restaurant } = useRestaurant();
	const { t } = useLanguage();
	const [placingOrder, setPlacingOrder] = useState(false);

	const table = params.get("table");
	const total = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
	const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);

	const goToMenu = () => params.set({ tab: "menu" });

	const handlePlaceOrder = async () => {
		if (selectedProducts.length === 0 || !restaurant) return;
		if (!table) {
			toast.error("No table selected. Please scan a table QR code first.");
			return;
		}

		setPlacingOrder(true);
		try {
			// Auto guest sign-in if not already authenticated as customer
			if (!session.data || session.data.role !== "customer") {
				const signInResult = await signIn("customer", {
					redirect: false,
					restaurant: restaurant.username,
					table,
					isGuest: "true",
				});
				if (signInResult?.error) {
					toast.error(signInResult.error);
					setPlacingOrder(false);
					return;
				}
				// Force NextAuth to sync the newly returned cookie with its internal token
				await session.update();
			}

			// Place the order — session cookie is now recognized by NextAuth
			const productsPayload = selectedProducts.map((p) => pick(p, ["_id", "quantity"]));
			const req = await fetch("/api/order/place", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ products: productsPayload }),
			});
			const res = await req.json();

			if (!req.ok) {
				toast.error(res?.message ?? "Failed to place order");
			} else {
				toast.success("Order placed successfully! 🎉");
				resetSelectedProducts();
				goToMenu();
			}
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setPlacingOrder(false);
		}
	};

	if (selectedProducts.length === 0) {
		return (
			<div className="orderSummaryPage">
				<div className="emptyState">
					<Lottie className="emptyAnim" src={getAnimSrc("FoodBurgerHappy")} size={220} />
					<h2>
						Your <span>Order</span>
					</h2>
					<p>{t("No items in the order yet")}</p>
					<Button label={t("Menu")} icon="e3e3" iconType="solid" onClick={goToMenu} />
				</div>
			</div>
		);
	}

	return (
		<div className="orderSummaryPage">
			<div className="summaryHeader">
				<h1>{t("Order Summary")}</h1>
				<p className="itemCount">
					{totalItems} {totalItems === 1 ? "item" : "items"}
				</p>
			</div>

			<div className="summaryItems">
				{selectedProducts.map((product) => (
					<div key={String(product._id)} className="summaryItem">
						{product.image && (
							<div className="itemImage">
								<span style={{ background: `url(${product.image}) center/cover no-repeat` }} />
							</div>
						)}
						<div className="itemDetails">
							<p className="itemName">{product.name}</p>
							{product.description && <p className="itemDescription">{product.description}</p>}
							<p className="itemPrice birr">
								{product.price} <span className="perUnit">/ item</span>
							</p>
						</div>
						<div className="itemActions">
							<div className="quantityControl">
								<button className="qtyBtn decrease" onClick={() => decreaseProductQuantity(product)} aria-label={`Decrease ${product.name}`}>
									<Icon code={product.quantity === 1 ? "f2ed" : "f068"} type="solid" size={14} />
								</button>
								<span className="qtyValue">{product.quantity}</span>
								<button className="qtyBtn increase" onClick={() => increaseProductQuantity(product)} aria-label={`Increase ${product.name}`}>
									<Icon code="f067" type="solid" size={14} />
								</button>
							</div>
							<p className="lineTotal birr">{product.price * product.quantity}</p>
						</div>
					</div>
				))}
			</div>

			<div className="summaryFooter">
				<div className="totalRow">
					<span className="totalLabel">{t("Total")}</span>
					<span className="totalValue birr">{total}</span>
				</div>
				<Button
					className="finishBtn"
					label={placingOrder ? t("Submitting...") : `${t("Place Order")} · Br ${total}`}
					icon="e1bc"
					iconType="solid"
					loading={placingOrder}
					onClick={handlePlaceOrder}
				/>
				<Button className="addMoreBtn" type="secondary" label="Add More Items" icon="f067" iconType="solid" onClick={goToMenu} />
			</div>
		</div>
	);
};

export default OrderSummaryPage;
