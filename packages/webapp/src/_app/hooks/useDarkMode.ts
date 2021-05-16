import { useEffect, useState } from "react";

const colorTheme = (darkMode: boolean) => (darkMode ? "dark" : "light");

const DARK_MODE = "DARK_MODE";

export default function useDarkMode(): [boolean, () => void] {
    const [isDark, setDark] = useState(false);

    const toggleDark = () => {
        const currentSetting = isDark;
        const newSetting = !currentSetting;
        const root = window.document.documentElement;
        root.classList.remove(colorTheme(currentSetting));
        root.classList.add(colorTheme(newSetting));
        setDark(!isDark);
        localStorage.setItem(DARK_MODE, colorTheme(newSetting));
    };

    useEffect(() => {
        const currentSetting = localStorage.getItem(DARK_MODE);
        const darkMode = currentSetting && currentSetting == colorTheme(true);
        if (darkMode) {
            toggleDark();
        }
    }, []);

    return [isDark, toggleDark];
}
