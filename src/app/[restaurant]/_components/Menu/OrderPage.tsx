import { signIn, signOut, useSession } from "next-auth/react";
import { type SyntheticEvent, type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import { ActionCard, Button, Icon, Spinner } from "xtreme-ui";

import SearchButton from "#components/base/SearchButton";
import SideSheet from "#components/base/SideSheet";
import { useLanguage } from "#components/context/LanguageContext";
import { useOrder, useRestaurant } from "#components/context/useContext";
import Modal from "#components/layout/Modal";
import type { TMenu } from "#utils/database/models/menu";
import { useQueryParams } from "#utils/hooks/useQueryParams";

import CartPage from "./CartPage";
import MenuCard from "./MenuCard";
import MenuItemDetail from "./MenuItemDetail";
import UserLogin from "./UserLogin";
import "./orderPage.scss";

const OrderPage = (props: TOrderPageProps) => {
	const session = useSession();
	const { loading, loginOpen, setLoginOpen } = useOrder();
	const { selectedProducts, increaseProductQuantity, decreaseProductQuantity, resetSelectedProducts } = props;
	const { restaurant } = useRestaurant();
	const { t } = useLanguage();

	const menus = restaurant?.menus as Array<TMenuCustom>;
	const params = useQueryParams();
	const table = params.get("table");
	const searchParam = params.get("search")?.trim() ?? "";
	const categoryParam = params.get("category")?.trim();
	const category = useMemo(() => (categoryParam ? categoryParam.split(",") : []), [categoryParam]);

	const order = useRef<HTMLDivElement>(null);
	const categories = useRef<HTMLDivElement>(null);
	const [sideSheetOpen, setSideSheetOpen] = useState(false);
	const [topHeading, setTopHeading] = useState(["Menu", "Category"]);
	const [orderHeading, setOrderHeading] = useState(["Explore", "Menu"]);
	const [sideSheetHeading, setSideSheetHeading] = useState<[string, string]>(["Your", "Order"]);

	const [searchActive, setSearchActive] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [floatHeader, setFloatHeader] = useState(false);
	const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
	const [rightCategoryScroll, setRightCategoryScroll] = useState(true);
	const [showInfoCard, setShowInfoCard] = useState(false);

	const [filteredProducts, setFilteredProducts] = useState<Array<TMenuCustom>>(menus);
	const [hasImageItems, setHasImageItems] = useState(false);
	const [hasNonImageItems, setHasNonImageItems] = useState(false);
	const [selectedItem, setSelectedItem] = useState<TMenuCustom | null>(null);

	const showOrderButton = restaurant?.tables?.some((t) => t.username === table && t.isActive);
	const eligibleToOrder = showOrderButton && (!session.data || session.data?.role === "customer");



	const onMenuScroll = (event: UIEvent<HTMLDivElement>) => {
		const scrollTop = (event.target as HTMLDivElement).scrollTop;
		if (scrollTop > 30) {
			setFloatHeader(true);
			setTopHeading(["Menu", "Category"]);
			if (order?.current && scrollTop >= order?.current?.offsetTop - 15) setTopHeading(orderHeading);
			return;
		}
		return setFloatHeader(false);
	};
	const onCategoryScroll = (event: SyntheticEvent) => {
		const target = event.target as HTMLElement;

		if (target.scrollLeft > 50) setLeftCategoryScroll(true);
		else setLeftCategoryScroll(false);

		if (Math.round(target.scrollWidth - target.scrollLeft) - 50 > target.clientWidth) setRightCategoryScroll(true);
		else setRightCategoryScroll(false);
	};
	const categoryScrollLeft = () => {
		if (categories.current) categories.current.scrollLeft -= 400;
	};
	const categoryScrollRight = () => {
		if (categories.current) categories.current.scrollLeft += 400;
	};
	const onCategoryClick = (categoryName: string) => {
		let newCategory = [];
		if (category.includes(categoryName)) newCategory = category.filter((item) => item !== categoryName);
		else newCategory = [...category, categoryName];

		params.set({ category: newCategory.join(",") });
	};

	useEffect(() => {
		const search = searchParam.toLowerCase();

		setFilteredProducts(
			menus?.filter?.(
				({ name, description, category: cat }) =>
					(search ? name?.toLowerCase().includes(search) || description?.toLowerCase().includes(search) || cat?.toLowerCase().includes(search) : true) &&
					(category.length ? category.includes(cat) : true),
			),
		);
	}, [category, menus, searchParam]);

	useEffect(() => {
		params.set({ category: category.filter((e) => restaurant?.profile.categories.includes(e)).join(",") });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [category, restaurant, params.set]);
	useEffect(() => {
		params.set({ search: searchValue });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchValue, params.set]);

	useEffect(() => {
		setHasImageItems(filteredProducts?.some((product) => !!product.image) ?? false);
		setHasNonImageItems(filteredProducts?.some((product) => !product.image) ?? false);
	}, [filteredProducts]);

	useEffect(() => {
		if (session.data?.role === "customer") setOrderHeading(["Choose", "Order"]);
		else setOrderHeading(["Explore", "Menu"]);
	}, [session]);

	useEffect(() => {
		if (session.status === "authenticated" && session.data?.restaurant?.username !== restaurant?.username) signOut();
	}, [restaurant?.username, session.data?.restaurant?.username, session.status]);

	return (
		<div className="orderPage">
			<div className="mainContainer" onScroll={onMenuScroll}>
				<div className={`mainHeader ${searchActive ? "searchActive" : ""} ${floatHeader ? "floatHeader" : ""}`}>
					<h1>
						{t(topHeading[0])} <span>{t(topHeading[1])}</span>
					</h1>
					<div className="options">
						<SearchButton setSearchActive={setSearchActive} placeholder={t("Search menu")} value={searchValue} setValue={setSearchValue} />
						{eligibleToOrder && (
							<Button
								icon="e43b"
								iconType="solid"
								label={`${selectedProducts?.length > 0 ? selectedProducts?.length : ""}`}
								onClick={() => setSideSheetOpen(true)}
							/>
						)}
						{session.data?.role === "admin" && (
							<Button className="dashboardButton" label={t("Dashboard")} icon="e09f" iconType="solid" onClick={() => params.router.push("/dashboard")} />
						)}
					</div>
				</div>
				{restaurant && (
					<div className="category">
						<div className="itemCategories" ref={categories} onScroll={onCategoryScroll}>
							{restaurant?.profile?.categories?.map((item, i) => (
								<ActionCard key={i} className={`menuCategory ${category.includes(item) ? "active" : ""}`} onClick={() => onCategoryClick(item)}>
									<span className="title">{item}</span>
								</ActionCard>
							))}
							<div className="space" />
							<div className={`scrollLeft ${leftCategoryScroll ? "show" : ""}`} onClick={categoryScrollLeft}>
								<Icon code="f053" type="solid" />
							</div>
							<div className={`scrollRight ${rightCategoryScroll ? "show" : ""}`} onClick={categoryScrollRight}>
								<Icon code="f054" type="solid" />
							</div>
						</div>
					</div>
				)}
				{!restaurant ? (
					<Spinner label="Loading Menu..." fullpage />
				) : (
					<div className="order" ref={order}>
						<div className="header">
							<h1>
								{t(orderHeading[0])} <span>{t(orderHeading[1])}</span>
							</h1>
						</div>
						{hasImageItems && (
							<div className={`itemContainer ${!eligibleToOrder ? "restrictOrder " : ""}`}>
								<div>
									{filteredProducts?.map(
										(item, key) =>
											!item.hidden && (
												<MenuCard
													key={key}
													item={item}
													restrictOrder={!eligibleToOrder}
													increaseQuantity={increaseProductQuantity}
													decreaseQuantity={decreaseProductQuantity}
													showInfo={item._id.toString() === selectedItem?._id.toString()}
													setShowInfo={() => setSelectedItem(item)}
													show={!!item.image}
													quantity={
														(selectedProducts.some((obj) => obj._id === item._id) &&
															selectedProducts?.find((obj) => obj._id === item._id)?.quantity) ||
														0
													}
												/>
											),
									)}
								</div>
							</div>
						)}
						{hasImageItems && hasNonImageItems && <hr />}
						{hasNonImageItems && (
							<div className={`itemContainer withoutImage ${!eligibleToOrder ? "restrictOrder " : ""}`}>
								<div>
									{filteredProducts?.map((item, key) => (
										<MenuCard
											key={key}
											item={item}
											restrictOrder={!eligibleToOrder}
											increaseQuantity={increaseProductQuantity}
											decreaseQuantity={decreaseProductQuantity}
											showInfo={item._id.toString() === selectedItem?._id.toString()}
											setShowInfo={() => setSelectedItem(item)}
											show={!item.image}
											quantity={
												(selectedProducts.some((obj) => obj._id === item._id) &&
													selectedProducts?.find((obj) => obj._id === item._id)?.quantity) ||
												0
											}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<SideSheet title={[t(sideSheetHeading[0]), t(sideSheetHeading[1])]} open={sideSheetOpen} setOpen={setSideSheetOpen}>
				{loading ? (
					<Spinner label="Loading Order..." fullpage />
				) : (
					<CartPage
						selectedProducts={selectedProducts}
						increaseProductQuantity={increaseProductQuantity}
						decreaseProductQuantity={decreaseProductQuantity}
						resetSelectedProducts={resetSelectedProducts}
						setSideSheetHeading={setSideSheetHeading}
						onFinish={() => setSideSheetOpen(false)}
					/>
				)}
			</SideSheet>
			<Modal open={loginOpen} setOpen={setLoginOpen}>
				<UserLogin setOpen={setLoginOpen} />
			</Modal>
			<Modal open={!!selectedItem} setOpen={() => setSelectedItem(null)} closeIcon="">
				{selectedItem && (
					<MenuItemDetail
						item={selectedItem}
						onClose={() => setSelectedItem(null)}
						increaseQuantity={increaseProductQuantity}
						decreaseQuantity={decreaseProductQuantity}
						quantity={selectedProducts.find((p) => p._id === selectedItem._id)?.quantity || 0}
					/>
				)}
			</Modal>


		</div>
	);
};

export default OrderPage;

type TMenuCustom = TMenu & { quantity: number };

type TOrderPageProps = {
	selectedProducts: Array<TMenuCustom>;
	increaseProductQuantity: (product: TMenuCustom) => void;
	decreaseProductQuantity: (product: TMenuCustom) => void;
	resetSelectedProducts: () => void;
};
