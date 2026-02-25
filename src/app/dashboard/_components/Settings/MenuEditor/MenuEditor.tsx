import { type UIEvent, useRef, useState } from "react";

import { toast } from "react-toastify";
import { Button, Icon, Spinner } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";
import MenuAddModal from "./MenuAddModal";
import MenuEditorItem from "./MenuEditorItem";
import "./menuEditor.scss";

type ViewMode = "card" | "list";

const MenuEditor = () => {
	const { profile, menus, profileLoading, profileMutate } = useAdmin();
	const [modalState, setModalState] = useState("");
	const [editItem, setEditItem] = useState<TMenu>();
	const [hideSettingsLoading, setHideSettingsLoading] = useState<string[]>([]);
	const [category, setCategory] = useState(0);
	const [viewMode, setViewMode] = useState<ViewMode>("card");

	const categories = useRef<HTMLDivElement>(null);

	const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
	const [rightCategoryScroll, setRightCategoryScroll] = useState(true);

	const onCategoryScroll = (event: UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		if (target.scrollLeft > 50) setLeftCategoryScroll(true);
		else setLeftCategoryScroll(false);

		if (Math.round(target.scrollWidth - target.scrollLeft) - 50 > target.clientWidth) setRightCategoryScroll(true);
		else setRightCategoryScroll(false);
	};
	const categoryScrollLeft = () => {
		if (categories?.current) categories.current.scrollLeft -= 400;
	};
	const categoryScrollRight = () => {
		if (categories?.current) categories.current.scrollLeft += 400;
	};
	const onHide = async (itemId: string, hidden: boolean) => {
		setHideSettingsLoading((v) => [...v, itemId]);
		const req = await fetch("/api/admin/menu/hidden", {
			method: "POST",
			body: JSON.stringify({ itemId, hidden }),
		});
		const res = await req.json();

		if (res?.status !== 200) toast.error(res?.message);

		await profileMutate();
		setHideSettingsLoading((v) => v.filter((item) => item !== itemId));
	};
	const onEdit = (item: TMenu) => {
		setEditItem(item);
		setModalState("menuItemEditState");
	};
	const onDelete = async (item: TMenu) => {
		if (!window.confirm(`Are you sure you want to remove "${item.name}"?`)) return;

		setHideSettingsLoading((v) => [...v, item._id.toString()]);
		try {
			const req = await fetch(`/api/admin/menu?id=${item._id}`, {
				method: "DELETE",
			});
			const res = await req.json();

			if (req.ok) {
				toast.success(res.message || "Menu item deleted");
				profileMutate();
			} else {
				toast.error(res.message || "Error deleting item");
			}
		} catch {
			toast.error("Error deleting item");
		}
		setHideSettingsLoading((v) => v.filter((id) => id !== item._id.toString()));
	};

	if (profileLoading) return <Spinner fullpage label="Loading Menu..." />;

	const filteredMenus = menus.filter((item) => (profile?.categories?.[category] ? item.category === profile.categories[category] : true));

	return (
		<div className="menuEditor">
			<div className="menuCategoryEditor">
				<div className="menuCategoryHeader">
					<h1 className="menuCategoryHeading">Menu Categories</h1>
					<div className="menuCategoryOptions" />
				</div>
				<div className="menuCategoryContainer" ref={categories} onScroll={onCategoryScroll}>
					{profile?.categories?.map((item, i) => (
						<div key={i} className={`menuCategory ${category === i ? "active" : ""}`} onClick={() => setCategory(i)}>
							<span className="title">{item}</span>
						</div>
					))}
					<div className="space" />
				</div>
				<div className={`scrollLeft ${leftCategoryScroll ? "show" : ""}`} onClick={categoryScrollLeft}>
					<Icon code="f053" type="solid" />
				</div>
				<div className={`scrollRight ${rightCategoryScroll ? "show" : ""}`} onClick={categoryScrollRight}>
					<Icon code="f054" type="solid" />
				</div>
			</div>
			<div className="menuItemEditor">
				<div className="menuItemHeader">
					<h1 className="menuItemHeading">Menu Items</h1>
					{/* View toggle */}
					<div className="menuViewToggle">
						<button type="button" className={`viewToggleBtn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")} title="Card View">
							<Icon code="f00a" type="solid" size={16} />
						</button>
						<button type="button" className={`viewToggleBtn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="List View">
							<Icon code="f03a" type="solid" size={16} />
						</button>
					</div>
				</div>
				<div className={`menuItemContainer ${viewMode === "list" ? "listView" : "cardView"}`}>
					{filteredMenus.map((item, id) => (
						<MenuEditorItem
							key={id}
							item={item}
							onEdit={onEdit}
							onHide={onHide}
							onDelete={onDelete}
							hideSettingsLoading={hideSettingsLoading.includes(item._id.toString())}
						/>
					))}
				</div>
			</div>
			<Button className={`menuEditorAdd ${modalState ? "active" : ""}`} onClick={() => setModalState("newState")} icon="2b" iconType="solid" />
			{modalState && (
				<MenuAddModal
					state={modalState}
					onClose={() => {
						setModalState("");
						setEditItem(undefined);
					}}
					editItem={editItem}
					onSuccess={() => profileMutate()}
				/>
			)}
		</div>
	);
};

export default MenuEditor;
