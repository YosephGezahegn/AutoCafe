import { QRCodeSVG } from "qrcode.react";
import { type FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";
import type { TTable } from "#utils/database/models/table";

import "./tableEditor.scss";

const TableEditor = () => {
	const { tables, profile, profileLoading, profileMutate } = useAdmin();
	const [modalState, setModalState] = useState(false);
	const [loading, setLoading] = useState(false);

	const onAddTable = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name"),
			username: formData.get("username"),
		};

		try {
			const req = await fetch("/api/admin/table", {
				method: "POST",
				body: JSON.stringify(data),
				headers: { "Content-Type": "application/json" },
			});
			const res = await req.json();

			if (req.ok) {
				toast.success(res.message || "Table Added");
				profileMutate();
				setModalState(false);
			} else {
				toast.error(res.message || "Error adding table");
			}
		} catch {
			toast.error("Error adding table");
		}
		setLoading(false);
	};

	const toggleTableStatus = async (table: TTable) => {
		try {
			const req = await fetch("/api/admin/table", {
				method: "PUT",
				body: JSON.stringify({
					id: (table as any)._id,
					isActive: !table.isActive,
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await req.json();

			if (req.ok) {
				toast.success(res.message || "Table Updated");
				profileMutate();
			} else {
				toast.error(res.message || "Error updating table");
			}
		} catch {
			toast.error("Error updating table status");
		}
	};

	const removeTable = async (table: TTable) => {
		if (!window.confirm(`Are you sure you want to remove ${table.name}?`)) return;

		try {
			const req = await fetch(`/api/admin/table?id=${(table as any)._id}`, {
				method: "DELETE",
			});
			const res = await req.json();

			if (req.ok) {
				toast.success(res.message || "Table Removed");
				profileMutate();
			} else {
				toast.error(res.message || "Error removing table");
			}
		} catch {
			toast.error("Error removing table");
		}
	};

	const copyQrLink = (table: TTable, url: string) => {
		navigator.clipboard
			.writeText(url)
			.then(() => toast.success(`Link for "${table.name}" copied!`))
			.catch(() => toast.error("Failed to copy link"));
	};

	if (profileLoading) return null;

	const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
	const getQrUrl = (tableUsername: string) => {
		return `${baseUrl}/${profile?.restaurantID || "unknown"}?table=${tableUsername}`;
	};

	const printQrCode = (table: TTable, url: string) => {
		const svgElement = document.getElementById(`qr-${table.username}`);
		if (!svgElement) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		printWindow.document.write(`
			<html>
				<head>
					<title>Print QR Code - ${table.name}</title>
					<style>
						body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
						.container { text-align: center; border: 2px dashed #000; padding: 40px; border-radius: 20px; }
						svg { width: 300px; height: 300px; margin-bottom: 20px; }
						h1 { font-size: 3rem; margin: 0 0 10px 0; }
						p { font-size: 1.5rem; color: #555; margin: 0; }
					</style>
				</head>
				<body>
					<div class="container">
						${svgElement.outerHTML}
						<h1>${table.name}</h1>
						<p>Scan to see Menu &amp; Order</p>
					</div>
					<script>
						window.onload = () => {
							setTimeout(() => { window.print(); window.close(); }, 500);
						};
					</script>
				</body>
			</html>
		`);
		printWindow.document.close();
	};

	return (
		<div className="tableEditor">
			<div className="tableHeader">
				<h2>Table Management</h2>
				<Button label="Add Table" onClick={() => setModalState(true)} icon="2b" iconType="solid" />
			</div>

			<div className="tableList">
				{tables.map((table, i) => (
					<div key={i} className="tableCard">
						<div className="tableInfo">
							<h3>{table.name}</h3>
							<p>ID: {table.username}</p>
							<div className="qrContainer">
								<QRCodeSVG id={`qr-${table.username}`} value={getQrUrl(table.username)} size={120} />
								<p>Scan to see Menu</p>
							</div>
						</div>
						<div className="tableActions">
							<Button label="Copy Link" type="secondary" icon="f0c5" iconType="solid" onClick={() => copyQrLink(table, getQrUrl(table.username))} />
							<Button label="Print QR" type="secondary" icon="f02f" iconType="solid" onClick={() => printQrCode(table, getQrUrl(table.username))} />
							<Button
								label={table.isActive ? "Lock Table" : "Activate Table"}
								type={table.isActive ? "secondaryDanger" : "primary"}
								onClick={() => toggleTableStatus(table)}
							/>
							<Button label="Remove" type="secondaryDanger" icon="f2ed" iconType="solid" onClick={() => removeTable(table)} />
						</div>
					</div>
				))}
			</div>

			{modalState && (
				<div className="modalOverlay">
					<div className="modalContainer">
						<h3>Add New Table</h3>
						<form onSubmit={onAddTable} className="modalForm">
							<div>
								<label>Table Name (e.g. Table 1)</label>
								<input name="name" required />
							</div>
							<div>
								<label>Table Identifier (e.g. table-1)</label>
								<input name="username" required />
							</div>
							<div className="modalActions">
								<Button label="Cancel" type="secondary" onClick={() => setModalState(false)} />
								<Button label="Save Table" type="primary" htmlType="submit" loading={loading} />
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default TableEditor;
