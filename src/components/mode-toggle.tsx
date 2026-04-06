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
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1.5px solid',
                borderColor: isDark ? '#3a2a2e' : '#e0d6d8',
                background: isDark ? '#1e1014' : '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 0.22s cubic-bezier(.22,1,.36,1)',
                flexShrink: 0,
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#C41E3A';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? '#3a2a2e' : '#e0d6d8';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
        >
            {isDark ? (
                <Moon
                    size={16}
                    style={{
                        color: '#fbbf24',
                        transition: 'transform 0.3s ease',
                        transform: 'rotate(-20deg)',
                    }}
                />
            ) : (
                <Sun
                    size={16}
                    style={{
                        color: '#C41E3A',
                        transition: 'transform 0.3s ease',
                        transform: 'rotate(0deg)',
                    }}
                />
            )}
        </button>
    )
}
