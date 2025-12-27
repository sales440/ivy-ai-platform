
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class CodeErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
                    <Card className="w-full max-w-2xl border-red-500/50 bg-slate-900 shadow-2xl">
                        <CardHeader className="border-b border-red-500/10 pb-4">
                            <CardTitle className="flex items-center gap-2 text-red-500">
                                <AlertCircle className="h-6 w-6" />
                                Critical System Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-200">Something went wrong in this component.</h3>
                                <p className="text-sm text-slate-400">
                                    The application has encountered a critical runtime error.
                                </p>
                            </div>

                            {this.state.error && (
                                <div className="rounded-md bg-black/50 p-4 border border-slate-800 font-mono text-xs overflow-auto max-h-[300px]">
                                    <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                                    {this.state.errorInfo && (
                                        <pre className="text-slate-500 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="default"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Reload System
                                </Button>
                                <Button
                                    onClick={() => this.setState({ hasError: false })}
                                    variant="outline"
                                    className="border-slate-700 hover:bg-slate-800"
                                >
                                    Try to Recover
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
