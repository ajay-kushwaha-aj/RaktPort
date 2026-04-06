// hospital/ProfileModal.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, MapPin, Phone, Hash, Mail, MessageSquarePlus } from "lucide-react";
import { FeedbackWidget } from "../FeedbackWidget";

export const ProfileModal = ({ isOpen, onClose, hospital }: { isOpen: boolean; onClose: () => void; hospital: any }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-sm rounded-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-[var(--clr-brand)]" style={{ fontFamily: "Outfit,sans-serif" }}>
          <Building2 className="w-5 h-5" /> Hospital Profile
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40">
          <div className="w-12 h-12 rounded-xl bg-rp-primary flex items-center justify-center text-[var(--txt-inverse)] text-2xl font-black" style={{ fontFamily: "Outfit,sans-serif" }}>
            {(hospital?.fullName || "H")[0]}
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)] dark:text-gray-100 text-sm">{hospital?.fullName || "—"}</p>
            <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-0.5">Hospital · RaktPort Registered</p>
          </div>
        </div>
        {[
          { icon: <MapPin className="w-4 h-4" />, label: "Location", val: `${hospital?.district || "—"}, ${hospital?.pincode || ""}` },
          { icon: <Phone className="w-4 h-4" />, label: "Contact", val: hospital?.mobile || "—" },
          { icon: <Hash className="w-4 h-4" />, label: "Reg. No.", val: hospital?.registrationNo || "—" },
          { icon: <Mail className="w-4 h-4" />, label: "Email", val: hospital?.email || "—" },
        ].map(r => (
          <div key={r.label} className="flex items-start gap-3 px-1">
            <span className="text-gray-400 dark:text-[var(--text-secondary)] mt-0.5 flex-shrink-0">{r.icon}</span>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">{r.label}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.val}</p>
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <FeedbackWidget customTrigger={
            <button className="w-full py-2.5 flex items-center justify-center gap-2 border-2 border-[var(--border-color)] dark:border-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <MessageSquarePlus className="w-4 h-4" /> Bug Report / Feedback
            </button>
          } />
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
