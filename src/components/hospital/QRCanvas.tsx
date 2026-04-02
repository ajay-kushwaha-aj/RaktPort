// hospital/QRCanvas.tsx
import { useRef, useEffect } from "react";
import QRious from "qrious";

export const QRCanvas = ({ data, size = 200 }: { data: string; size?: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && data) {
      try { new QRious({ element: ref.current, value: data, size, foreground: "var(--clr-brand)", level: "H" }); }
      catch (_) { /* QR generation failed silently */ }
    }
  }, [data, size]);
  return <canvas ref={ref} width={size} height={size} className="rounded-lg" />;
};
