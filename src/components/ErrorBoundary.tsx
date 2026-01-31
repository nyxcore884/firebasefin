
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-10 text-center">
                    <div>
                        <h1 className="text-4xl font-bold text-rose-500 mb-4">System Critical Error</h1>
                        <pre className="text-slate-300 mb-8 max-w-2xl mx-auto bg-black/30 p-4 rounded text-left overflow-auto">
                            {this.state.error?.message || "An unknown error occurred."}
                        </pre>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 font-bold"
                        >
                            Reset System & Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
