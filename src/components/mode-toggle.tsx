import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    // Resolve actual theme (handle "system")
    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

    const toggle = () => setTheme(isDark ? "light" : "dark")

    return (
        <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ background: isDark ? '#4a1a1a' : '#f3e8e8' }}
        >
            {/* Sliding knob */}
            <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300"
                style={{
                    transform: isDark ? 'translateX(26px)' : 'translateX(4px)',
                    background: isDark ? '#1a1a2e' : '#fff',
                }}
            >
                {isDark
                    ? <Moon className="h-3.5 w-3.5 text-yellow-300" />
                    : <Sun className="h-3.5 w-3.5 text-[var(--clr-emergency)]" />
                }
            </span>
        </button>
    )
}
