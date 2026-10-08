import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("yieldsense-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("yieldsense-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark((value) => !value)}
      aria-label="Toggle theme"
      aria-pressed={dark}
      type="button"
    >
      <span>{dark ? "☾" : "☀"}</span>
      <i className={dark ? "on" : ""} />
    </button>
  );
}
