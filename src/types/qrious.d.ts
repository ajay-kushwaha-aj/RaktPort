declare module "qrious" {
  interface QRiousOptions {
    element?: HTMLCanvasElement;
    value: string;
    size?: number;
    foreground?: string;
    background?: string;
    level?: "L" | "M" | "Q" | "H";
    mime?: string;
    padding?: number;
  }

  class QRious {
    constructor(options: QRiousOptions);
    toDataURL(mime?: string): string;
    set(options: Partial<QRiousOptions>): void;
  }

  export = QRious;
}
