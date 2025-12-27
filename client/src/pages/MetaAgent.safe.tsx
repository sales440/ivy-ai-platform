
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

// Minimal Safe MetaAgent for testing
export default function MetaAgent() {
    return (
        <div className="flex h-screen bg-black text-white items-center justify-center">
            <Card className="w-[400px] bg-slate-900 border-green-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                        <Activity className="h-6 w-6" />
                        System Recovery Mode
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-300 mb-4">
                        The ROPA Dashboard is running in safe mode.
                        <br />
                        Router is functioning correctly.
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                        Reconnecting Modules...
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
