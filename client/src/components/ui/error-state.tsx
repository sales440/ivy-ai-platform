import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    message = "An error occurred while loading this content.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-6 space-y-4 text-center min-h-[200px] ${className}`}>
            <div className="bg-red-500/10 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-1">
                <h3 className="font-semibold text-lg text-slate-200">{title}</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">{message}</p>
            </div>
            {onRetry && (
                <Button variant="outline" onClick={onRetry} className="gap-2 border-slate-700 hover:bg-slate-800">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            )}
        </div>
    );
}

export function InlineError({ message, className }: { message: string, className?: string }) {
    return (
        <Alert variant="destructive" className={`my-2 ${className}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}
