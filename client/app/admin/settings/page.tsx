import type { Metadata } from "next";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, ShieldAlert } from "lucide-react";
import fs from "fs/promises";
import path from "path";
import { resetLocalData } from "@/app/actions/reset-data";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure system settings and local data persistence for Pomelo.",
};

const QUESTIONS_FILE = path.join(process.cwd(), "data", "questions.json");

async function getLocalQuestions() {
    try {
        const data = await fs.readFile(QUESTIONS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    await getLocalQuestions();

    return (
        <div className="h-full w-full overflow-y-scroll bg-background">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Manage your local environment and data persistence.
                    </p>
                </div>

                {/* Question Management Section
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-primary" />
                            Local Question Management
                        </CardTitle>
                        <CardDescription>
                            View and remove questions you've added locally.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {localQuestions.length > 0 ? (
                            <div className="divide-y divide-border border rounded-lg overflow-hidden">
                                {localQuestions.map((q: any) => (
                                    <div key={q.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-foreground truncate">{q.title}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase">{q.difficulty}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{q.description}</p>
                                        </div>
                                        <form action={async () => {
                                            "use server";
                                            await deleteQuestion(`local-${q.id}`);
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
                                <p className="text-muted-foreground italic">No locally added questions found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card> */}

                {/* Danger Zone */}
                <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>Irreversible actions for your local data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background">
                            <div>
                                <p className="font-semibold text-foreground">Reset All Local Data</p>
                                <p className="text-sm text-muted-foreground">Clear all added questions and reset statistics to default.</p>
                            </div>
                            <form action={async () => {
                                "use server";
                                await resetLocalData();
                            }}>
                                <Button variant="destructive" className="flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Reset Everything
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
