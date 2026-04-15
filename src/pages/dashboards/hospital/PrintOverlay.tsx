// hospital/PrintOverlay.tsx — Print window logic for blood requisition slips

import { buildSlipHTML } from "./buildSlipHTML";
import type { BloodRequest } from "./types";

/**
 * Opens a new browser window with the print-ready blood requisition slip.
 * Converts the logo to a data URL first, then writes the full HTML and triggers print.
 */
export const openPrintWindow = (request: BloodRequest | null, hospital: any, logoSrc: string) => {
  if (!request) return;

  const tryGetLogo = (): Promise<string> => new Promise(resolve => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(c.toDataURL());
          } else {
            resolve("");
          }
        } catch {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = logoSrc;
    } catch {
      resolve("");
    }
  });

  tryGetLogo().then(logoDataUrl => {
    const html = buildSlipHTML(request, hospital, logoDataUrl);
    const win = window.open("", "_blank", "width=850,height=1100,scrollbars=yes");
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } else {
      // Fallback: create blob URL
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  });
};
