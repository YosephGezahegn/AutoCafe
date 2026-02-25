import noop from "lodash/noop";
import { useSearchParams } from "next/navigation";
import { createContext, type ReactNode, useEffect, useState } from "react";
import { toast } from "react-toastify";
import useSWR from "swr";

import type { TMenu } from "#utils/database/models/menu";
import type { TOrder } from "#utils/database/models/order";
import type { TProfile } from "#utils/database/models/profile";
import type { TStaffCall } from "#utils/database/models/staffcall";
import type { TTable } from "#utils/database/models/table";
import { fetcher } from "#utils/helper/common";

const AdminDefault: TAdminInitialType = {
	profile: undefined,
	menus: [],
	tables: [],
	profileLoading: false,
	profileMutate: () => new Promise(noop),
	orderRequest: [],
	orderActive: [],
	orderHistory: [],
	orderAction: () => new Promise(noop),
	orderActionLoading: false,
	orderLoading: false,
	staffCalls: [],
	resolveStaffCall: () => new Promise(noop),
};

const sortByDate = (a: { updatedAt: string | number | Date }, b: { updatedAt: string | number | Date }) =>
	new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

export const AdminContext = createContext(AdminDefault);
export const AdminProvider = ({ children }: TAdminProviderProps) => {
	const params = useSearchParams();
	const _tab = params.get("tab");
	const _subTab = params.get("subTab");
	const { data: { profile, menus = [], tables = [] } = {}, isLoading: profileLoading, mutate: profileMutate } = useSWR("/api/admin", fetcher);
	const { data: fetchResult, isLoading: orderLoading, mutate } = useSWR("/api/admin/order", fetcher, { refreshInterval: 5000 });
	const orderData = fetchResult?.orders || [];
	const staffCalls = fetchResult?.staffCalls || [];
	const sessions = fetchResult?.sessions || [];
	const [orderActionLoading, setOrderActionLoading] = useState(false);

	const { orderRequest, orderActive } =
		orderData?.reduce?.(
			(acc: { orderRequest: TOrder[]; orderActive: TOrder[] }, order: TOrder) => {
				if (order.state === "active") {
					if (order.products.some(({ adminApproved }) => adminApproved)) acc.orderActive.push(order);
					if (order.products.some(({ adminApproved }) => !adminApproved)) acc.orderRequest.push(order);
				}
				return acc;
			},
			{ orderRequest: [], orderActive: [] },
		) ?? {};

	const orderHistory = sessions;

	[orderRequest, orderActive, orderHistory].forEach((arr) => arr?.sort?.(sortByDate));

	const orderAction = async (orderID: string, action: TOrderAction) => {
		if (orderActionLoading) return;
		setOrderActionLoading(true);
		const req = await fetch("/api/admin/order/action", { method: "POST", body: JSON.stringify({ orderID, action }) });
		const res = await req.json();

		if (!req.ok) toast.error(res?.message);
		await mutate();
		setOrderActionLoading(false);
	};

	const resolveStaffCall = async (callId: string) => {
		try {
			const req = await fetch("/api/admin/staff-calls/action", { method: "POST", body: JSON.stringify({ callId, action: "resolve" }) });
			const res = await req.json();
			if (req.ok) {
				toast.success("Staff call resolved");
				await mutate();
			} else {
				toast.error(res.message || "Failed to resolve staff call");
			}
		} catch {
			toast.error("Failed to connect");
		}
	};

	useEffect(() => {
		mutate();
	}, [mutate]);

	return (
		<AdminContext.Provider
			value={{
				profile,
				menus,
				tables,
				profileLoading,
				profileMutate,
				orderRequest,
				orderActive,
				orderHistory,
				orderAction,
				orderActionLoading,
				orderLoading,
				staffCalls,
				resolveStaffCall,
			}}>
			{children}
		</AdminContext.Provider>
	);
};

export type TAdminProviderProps = {
	children?: ReactNode;
};

export type TAdminInitialType = {
	profile?: TProfile;
	menus: TMenu[];
	tables: TTable[];
	profileLoading: boolean;
	profileMutate: () => Promise<void>;
	orderRequest: TOrder[];
	orderActive: TOrder[];
	orderHistory: any[];
	orderAction: (orderID: string, action: TOrderAction) => Promise<void>;
	orderActionLoading: boolean;
	orderLoading: boolean;
	staffCalls: TStaffCall[];
	resolveStaffCall: (callId: string) => Promise<void>;
};

export type TOrderAction = "accept" | "complete" | "reject" | "rejectOnActive";
