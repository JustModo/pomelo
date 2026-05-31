import type { Metadata } from "next";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Settings",
    description: "Configure system settings for Pomelo.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    return (
        <div className="flex flex-col h-full bg-muted/30">
            {/* Header section */}
            <div className="flex items-center justify-between p-6 bg-background border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        System configuration and global preferences
                    </p>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 p-6 overflow-auto">
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-4 border-b border-border">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            General Settings
                        </CardTitle>
                        <CardDescription>
                            Configure core platform behavior.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="text-center text-muted-foreground py-10">
                            No customizable settings available yet. 
                            Settings for MongoDB connections and deployment are configured via environment variables.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
