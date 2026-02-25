import { type FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "xtreme-ui";
import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";

type TMenuModalProps = {
	state: string;
	onClose: () => void;
	editItem?: TMenu;
	onSuccess: () => void;
};

const MenuAddModal = ({ state, onClose, editItem, onSuccess }: TMenuModalProps) => {
	const { profile } = useAdmin();
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const _data = {
			name: formData.get("name"),
			category: formData.get("category"),
			price: Number(formData.get("price")),
			taxPercent: Number(formData.get("taxPercent")),
			foodType: formData.get("foodType"),
			veg: formData.get("veg"),
			image: formData.get("image"),
			hidden: false,
			nutritionalValue: {
				calories: Number(formData.get("calories") || 0),
				protein: Number(formData.get("protein") || 0),
				carbs: Number(formData.get("carbs") || 0),
				fats: Number(formData.get("fats") || 0),
			},
		};

		const url = "/api/admin/menu";
		const method = editItem ? "PUT" : "POST";

		if (editItem) {
			formData.append("id", editItem._id.toString());
		}

		try {
			const req = await fetch(url, {
				method,
				body: formData,
			});
			const res = await req.json();

			if (req.ok) {
				toast.success(res.message || "Menu Saved");
				onSuccess();
				onClose();
			} else {
				toast.error(res.message || "An error occurred");
			}
		} catch (_error) {
			toast.error("An error occurred");
		}
		setLoading(false);
	};

	if (!state) return null;

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0,0,0,0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}>
			<div
				style={{
					backgroundColor: "var(--theme-bg, #fff)",
					padding: 20,
					borderRadius: 10,
					width: 500,
					maxHeight: "90vh",
					overflowY: "auto",
					border: "1px solid var(--theme-border, #ddd)",
				}}>
				<h2 style={{ marginBottom: 20 }}>{editItem ? "Edit Menu Item" : "Add Menu Item"}</h2>
				<form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
					<div>
						<label>Name</label>
						<input
							className="xtf"
							name="name"
							defaultValue={editItem?.name}
							required
							style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
						/>
					</div>
					<div>
						<label>Description</label>
						<textarea
							className="xtf"
							name="description"
							defaultValue={editItem?.description}
							style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc", fontFamily: "inherit" }}
							rows={3}
						/>
					</div>
					<div>
						<label>Category</label>
						<input
							className="xtf"
							name="category"
							list="existing-categories"
							defaultValue={editItem?.category}
							required
							style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
						/>
						<datalist id="existing-categories">
							{profile?.categories?.map((cat) => (
								<option key={cat} value={cat} />
							))}
						</datalist>
					</div>
					<div>
						<label>Image Upload</label>
						<input
							className="xtf"
							name="imageFile"
							type="file"
							accept="image/*"
							style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc", background: "transparent", color: "var(--theme-text)" }}
						/>
						{editItem?.image && (
							<p style={{ fontSize: "0.8rem", color: "#666", marginTop: 5 }}>
								Current image:{" "}
								<a href={editItem.image} target="_blank" rel="noreferrer">
									View
								</a>
							</p>
						)}
					</div>
					<div style={{ display: "flex", gap: 10 }}>
						<div style={{ flex: 1 }}>
							<label>Price</label>
							<input
								className="xtf"
								name="price"
								type="number"
								defaultValue={editItem?.price?.toString()}
								required
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<label>Tax Pct (%)</label>
							<input
								className="xtf"
								name="taxPercent"
								type="number"
								defaultValue={editItem?.taxPercent?.toString()}
								required
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
							/>
						</div>
					</div>
					<div style={{ display: "flex", gap: 10 }}>
						<div style={{ flex: 1 }}>
							<label>Food Type</label>
							<select
								className="xtf"
								name="foodType"
								defaultValue={editItem?.foodType}
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}>
								<option value="spicy">Spicy</option>
								<option value="extra-spicy">Extra Spicy</option>
								<option value="sweet">Sweet</option>
								<option value="">None</option>
							</select>
						</div>
						<div style={{ flex: 1 }}>
							<label>Veg Status</label>
							<select
								className="xtf"
								name="veg"
								defaultValue={editItem?.veg}
								required
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}>
								<option value="veg">Veg</option>
								<option value="non-veg">Non-Veg</option>
								<option value="contains-egg">Contains Egg</option>
							</select>
						</div>
					</div>
					<h4 style={{ margin: "10px 0 0 0" }}>Nutritional Information</h4>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
						<div>
							<label>Calories</label>
							<input
								className="xtf"
								name="calories"
								type="number"
								defaultValue={editItem?.nutritionalValue?.calories?.toString()}
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
							/>
						</div>
						<div>
							<label>Protein (g)</label>
							<input
								className="xtf"
								name="protein"
								type="number"
								defaultValue={editItem?.nutritionalValue?.protein?.toString()}
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
							/>
						</div>
						<div>
							<label>Carbs (g)</label>
							<input
								className="xtf"
								name="carbs"
								type="number"
								defaultValue={editItem?.nutritionalValue?.carbs?.toString()}
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
							/>
						</div>
						<div>
							<label>Fats (g)</label>
							<input
								className="xtf"
								name="fats"
								type="number"
								defaultValue={editItem?.nutritionalValue?.fats?.toString()}
								style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
							/>
						</div>
					</div>
					<div style={{ display: "flex", gap: 10, marginTop: 20 }}>
						<Button label="Cancel" type="secondary" onClick={onClose} />
						<Button label="Save" type="primary" htmlType="submit" loading={loading} />
					</div>
				</form>
			</div>
		</div>
	);
};

export default MenuAddModal;
