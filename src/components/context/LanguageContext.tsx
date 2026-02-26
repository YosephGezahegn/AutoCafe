"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

type Language = "en" | "am";

interface LanguageContextProps {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
	order: { en: "Order", am: "እዘዝ" },
	orders: { en: "Orders", am: "ትዕዛዞች" },
	menu: { en: "Menu", am: "ማውጫ" },
	logout: { en: "Logout", am: "ውጣ" },
	reviews: { en: "Reviews", am: "አስተያየቶች" },
	contact: { en: "Contact", am: "አድራሻ" },
	Menu: { en: "Menu", am: "ማውጫ" },
	Category: { en: "Category", am: "ምድብ" },
	Explore: { en: "Explore", am: "ተመልከት" },
	Choose: { en: "Choose", am: "ምረጥ" },
	Your: { en: "Your", am: "የእርስዎ" },
	Order: { en: "Order", am: "ትዕዛዝ" },
	Dashboard: { en: "Dashboard", am: "ዳሽቦርድ" },
	"Place Order": { en: "Place Order", am: "ትዕዛዝ አስገባ" },
	"Search menu": { en: "Search menu", am: "ማውጫ ፈልግ" },
	"Order Summary": { en: "Order Summary", am: "የትዕዛዝ ማጠቃለያ" },
	Total: { en: "Total", am: "ጠቅላላ" },
	Tax: { en: "Tax", am: "ታክስ" },
	"Add to order": { en: "Add to order", am: "ወደ ትዕዛዝ ጨምር" },
	"Leave a review": { en: "Leave a review", am: "አስተያየት ይተዉ" },
	"Submit Review": { en: "Submit Review", am: "አስተያየት ላክ" },
	"Aren't you hungry?": { en: "Aren't you hungry?", am: "አልራበዎትም?" },
	"Your order": { en: "Your order", am: "የእርስዎ ትዕዛዝ" },
	"will be accepted soon": { en: "will be accepted soon", am: "በቅርቡ ተቀባይነት ያገኛል" },
	"Cancel Order": { en: "Cancel Order", am: "ትዕዛዝ ሰርዝ" },
	"Order History": { en: "Order History", am: "የትዕዛዝ ታሪክ" },
	Bill: { en: "Bill", am: "ሂሳብ" },
	Summary: { en: "Summary", am: "ማጠቃለያ" },
	"Sub Total": { en: "Sub Total", am: "ንዑስ ድምር" },
	close: { en: "close", am: "ዝጋ" },
	"Finish Ordering": { en: "Finish Ordering", am: "ማዘዝ ይጨርሱ" },
	"Proceed to Pay": { en: "Proceed to Pay", am: "ወደ ክፍያ ይቀጥሉ" },
	"Item Total": { en: "Item Total", am: "የዕቃ ድምር" },
	"Tax Summary": { en: "Tax Summary", am: "የታክስ ማጠቃለያ" },
	"Tax Total": { en: "Tax Total", am: "ጠቅላላ ታክስ" },
	"Grand Total": { en: "Grand Total", am: "አጠቃላይ ድምር" },
	"show details": { en: "show details", am: "ዝርዝር አሳይ" },

	"Additional items ordered successfully": { en: "Additional items ordered successfully", am: "ተጨማሪ ትዕዛዞች በተሳካ ሁኔታ ተላልፈዋል" },
	"Order placed successfully": { en: "Order placed successfully", am: "ትዕዛዝዎ በተሳካ ሁኔታ ተላልፏል" },
	"Customer Reviews": { en: "Customer Reviews", am: "የደንበኞች አስተያየት" },
	"How was your experience at": { en: "How was your experience at", am: "በምን ያህል ደስተዋል" },
	"Leave a comment (Optional)": { en: "Leave a comment (Optional)", am: "አስተያየት ይተዉ (እንደ ምርጫዎ)" },
	"Submitting...": { en: "Submitting...", am: "እየላከ ነው..." },
	"Thank you for your review!": { en: "Thank you for your review!", am: "ስለ አስተያየትዎ እናመሰግናለን!" },
	"Contact Information": { en: "Contact Information", am: "የመገናኛ አድራሻ" },
	"Get in touch with us": { en: "Get in touch with us", am: "ከእኛ ጋር ይገናኙ" },
	"Item Summary": { en: "Item Summary", am: "የትዕዛዝ ዝርዝር" },
	"No items in the order yet": { en: "No items in the order yet", am: "ምንም ትዕዛዝ የለም" },
	"Table is locked by staff. Cannot accept orders at this time.": {
		en: "Table is locked by staff. Cannot accept orders at this time.",
		am: "ይህ ጠረጴዛ በአሁኑ ጊዜ ተቆልፏል። ትዕዛዝ መቀበል አይቻልም።",
	},
	"Table In Use": { en: "Table In Use", am: "ጠረጴዛው በጥቅም ላይ ነው" },
	"Table is already in use by another person.": { en: "Table is already in use by another person.", am: "ጠረጴዛው በሌላ ሰው እየተጠቀመ ነው።" },
	"Please request staff to activate this table to start ordering.": {
		en: "Please request staff to activate this table to start ordering.",
		am: "ትዕዛዝ ለመጀመር እባክዎ አስተናጋጁን ይጠይቁ።",
	},
	"Table is locked": { en: "Table is locked", am: "ጠረጴዛው ተቆልፏል" },
	"Waiting for activation...": { en: "Waiting for activation...", am: "ማግበር በመጠበቅ ላይ..." },
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
	const [language, setLanguage] = useState<Language>("en");

	const t = (key: string) => {
		if (translations[key]) {
			return translations[key][language] || translations[key].en;
		}
		return key;
	};

	return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
};
