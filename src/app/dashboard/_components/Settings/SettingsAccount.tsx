import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button, Spinner } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";
import { splitStringByFirstWord } from "#utils/helper/common";
import OrderSettings from "./OrderSettings";
import PasswordSettings from "./PasswordSettings";
import ThemeSettings from "./ThemeSettings";
import "./settingsAccount.scss";

const SettingsAccount = () => {
	const router = useRouter();
	const { profile } = useAdmin();
	const session = useSession();
	const [restaurantName, setRestaurantName] = useState<string[]>([]);

	useEffect(() => {
		if (profile?.name) setRestaurantName(splitStringByFirstWord(profile?.name) ?? []);
	}, [profile?.name]);

	if (session.status === "loading" || !profile) return <Spinner fullpage label="Loading Account..." />;

	return (
		<div className="settingsAccount">
			<div className="profileSettingsCard">
				{profile?.avatar && <img className="avatar" src={profile?.avatar} alt={profile?.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />}
				<div className="restaurantDetails">
					<h1 className="name">
						{restaurantName[0]} <span>{restaurantName[1]}</span>
					</h1>
					<h6 className="address">{profile?.address}</h6>
				</div>
				<Button className="logout" icon="f011" onClick={() => router.push("/logout")} />
			</div>
			<PasswordSettings />
			<ThemeSettings />
			<OrderSettings />
		</div>
	);
};

export default SettingsAccount;
