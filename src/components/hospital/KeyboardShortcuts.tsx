// hospital/KeyboardShortcuts.tsx — Help modal for keyboard shortcuts (Phase 4)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; }

const SHORTCUTS = [
  { section: "Navigation", items: [
    { keys: ["Ctrl", "K"], desc: "Open Global Search" },
    { keys: ["Esc"], desc: "Close modals / overlays" },
  ]},
  { section: "Quick Actions", items: [
    { keys: ["N"], desc: "New Request (when no input focused)" },
    { keys: ["E"], desc: "Emergency Request (when no input focused)" },
    { keys: ["R"], desc: "Refresh Dashboard (when no input focused)" },
    { keys: ["?"], desc: "Show this help" },
  ]},
  { section: "Tabs", items: [
    { keys: ["1"], desc: "Dashboard tab" },
    { keys: ["2"], desc: "All Requests tab" },
    { keys: ["3"], desc: "Blood Inventory tab" },
    { keys: ["4"], desc: "Analytics tab" },
    { keys: ["5"], desc: "Transfusion History tab" },
    { keys: ["6"], desc: "Audit Trail tab" },
  ]},
];

export function KeyboardShortcuts({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--clr-brand)]" style={{ fontFamily: "Outfit,sans-serif" }}>
            <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Quick access keys for power users</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map(s => (
            <div key={s.section}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{s.section}</p>
              <div className="space-y-1.5">
                {s.items.map(item => (
                  <div key={item.desc} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <span key={k}>
                          <kbd className="px-2 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm" style={{ fontFamily: "Outfit,monospace" }}>{k}</kbd>
                          {i < item.keys.length - 1 && <span className="text-[10px] text-gray-300 dark:text-gray-600 mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
