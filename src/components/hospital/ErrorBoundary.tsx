// hospital/ErrorBoundary.tsx — Catches runtime errors in hospital dashboard
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[HospitalDashboard Error]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-[var(--clr-emergency)] dark:text-[var(--clr-emergency)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--txt-heading)] dark:text-gray-100" style={{ fontFamily: "Outfit,sans-serif" }}>
            {this.props.fallbackTitle || "Something went wrong"}
          </h3>
          <p className="text-sm text-[var(--txt-body)] dark:text-gray-400 mt-1 max-w-md">
            An unexpected error occurred in the dashboard. This has been logged automatically.
          </p>
          {this.state.error && (
            <code className="text-xs text-[var(--clr-emergency)] dark:text-[var(--clr-emergency)] bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg mt-3 max-w-md truncate block">
              {this.state.error.message}
            </code>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: undefined }); }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--clr-brand)] text-[var(--txt-inverse)] rounded-xl text-sm font-semibold hover:bg-[#6b0000] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
