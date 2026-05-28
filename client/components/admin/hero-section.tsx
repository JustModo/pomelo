"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Calendar,
  Activity,
  ArrowUpRight,
  Code,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Test } from "@/types/test";
import { getTestStatusBadgeVariant, getTestStatusLabel } from "@/lib/test-status";

export interface DashboardStats {
  activeContests: number;
  draftedTests: number;
  completedTests: number;
  totalQuestions: number;
  totalParticipants: number;
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
}

interface HeroSectionProps {
  stats: DashboardStats;
  recentTests: Test[];
}

export default function HeroSection({ stats, recentTests }: HeroSectionProps) {

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Admin Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your coding events and track platform metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border">
          <Calendar className="h-4 w-4" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Contests"
          value={stats.activeContests}
          icon={Activity}
          description="Currently live events"
          href="/admin/tests?status=ongoing"
        />
        <StatsCard
          title="Total Questions"
          value={stats.totalQuestions}
          icon={Code}
          description="Question bank size"
          href="/admin/questions"
        />
        <StatsCard
          title="Draft Tests"
          value={stats.draftedTests}
          icon={FileText}
          description="Upcoming assessments"
          href="/admin/tests?status=waiting"
        />
        <StatsCard
          title="Total Participants"
          value={stats.totalParticipants}
          icon={Users}
          description="Across all events"
          href="/admin/tests" // Use general link as we don't have a users page confirmed
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contests Area */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tests</CardTitle>
              <CardDescription>
                Overview of all created tests and their status.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/tests">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentTests.map((test) => (
                <Link
                  key={test._id || test.id}
                  href={`/admin/tests/${test._id || test.id}`}
                  className="flex flex-col p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant={getTestStatusBadgeVariant(test.status)}
                      className="mb-2 capitalize"
                    >
                      {getTestStatusLabel(test.status)}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground truncate">
                    {test.title}
                  </h3>
                  <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {(test.participantsInProgress || 0) + (test.participantsCompleted || 0)}
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {test.duration}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Bank Breakdown */}
        <Card className="shadow-sm border-border bg-linear-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Question Bank
            </CardTitle>
            <CardDescription>Difficulty distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <DifficultyBar
                label="Easy"
                count={stats.easyQuestions}
                total={stats.totalQuestions}
                colorClass="bg-primary"
              />
              <DifficultyBar
                label="Medium"
                count={stats.mediumQuestions}
                total={stats.totalQuestions}
                colorClass="bg-secondary-foreground"
              />
              <DifficultyBar
                label="Hard"
                count={stats.hardQuestions}
                total={stats.totalQuestions}
                colorClass="bg-destructive"
              />

              <div className="pt-4 border-t border-border mt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full">Add New Question</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full">
                    <DropdownMenuItem asChild>
                      <Link href="/admin/questions/coding/new">Coding Question</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/questions/mcq/new">Multiple Choice</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// Helper Components
const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  href: string;
}) => (
  <Link href={href}>
    <Card className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  </Link>
);

const DifficultyBar = ({
  label,
  count,
  total,
  colorClass
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-300/20 dark:border-zinc-700/20">
        <div
          className={`h-full ${colorClass} transition-all duration-500 shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
