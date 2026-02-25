import { Button, Icon } from "xtreme-ui";
import type { TMenu } from "#utils/database/models/menu";
import "./menuItemDetail.scss";

type TMenuItemDetailProps = {
	item: TMenu & { quantity: number };
	onClose: () => void;
	increaseQuantity: (item: any) => void;
	decreaseQuantity: (item: any) => void;
	quantity: number;
};

const MenuItemDetail = ({ item, onClose, increaseQuantity, decreaseQuantity, quantity }: TMenuItemDetailProps) => {
	return (
		<div className="menuItemDetail">
			<div className="imageHeader">
				<div className="imageBlur" style={{ backgroundImage: item.image ? `url(${item.image})` : "none", backgroundColor: "#eee" }} />
				{item.image && <img src={item.image} alt={item.name} className="mainImage" />}
				<Button className="closeBtn" icon="f00d" onClick={onClose} size="mini" />
			</div>

			<div className="content">
				<div className="titleRow">
					<h2 className="name">{item.name}</h2>
					<div className={`vegBadge ${item.veg}`}>
						<Icon type="solid" code={item.veg === "veg" ? "f4d8" : item.veg === "non-veg" ? "f6d6" : "f7fb"} />
					</div>
				</div>

				<div className="category">{item.category}</div>
				<div className="price birr">{item.price}</div>

				<p className="description">{item.description}</p>

				{item.nutritionalValue && (
					<div className="nutritionalSection">
						<h3>Nutritional Values</h3>
						<div className="grid">
							<div className="stat">
								<span>Calories</span> <strong>{item.nutritionalValue.calories || 0} kcal</strong>
							</div>
							<div className="stat">
								<span>Protein</span> <strong>{item.nutritionalValue.protein || 0} g</strong>
							</div>
							<div className="stat">
								<span>Carbs</span> <strong>{item.nutritionalValue.carbs || 0} g</strong>
							</div>
							<div className="stat">
								<span>Fats</span> <strong>{item.nutritionalValue.fats || 0} g</strong>
							</div>
						</div>
					</div>
				)}

				<div className="footer">
					<div className="qtyControls">
						<Button icon="f068" onClick={() => decreaseQuantity(item)} disabled={quantity === 0} />
						<span className="qty">{quantity}</span>
						<Button icon="f067" onClick={() => increaseQuantity(item)} />
					</div>
					<Button label={quantity > 0 ? "Update Cart" : "Done"} type="primary" onClick={onClose} />
				</div>
			</div>
		</div>
	);
};

export default MenuItemDetail;
