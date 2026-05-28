import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "View all public and administration pages available on Pomelo.",
};

const sitemap = [
  {
    heading: "Admin",
    links: [
      { path: "/admin", label: "Dashboard" },
      { path: "/admin/questions", label: "Questions" },
      { path: "/admin/questions/mcq/new", label: "New Question (MCQ)" },
      { path: "/admin/questions/coding/1/edit", label: "Edit Question" },
      { path: "/admin/tests", label: "Tests" },
      { path: "/admin/tests/2", label: "View Test" },
      { path: "/admin/tests/2/edit", label: "Edit Test" },
      { path: "/admin/tests/2/result", label: "Test Result" },
    ],
  },
  {
    heading: "Auth",
    links: [
      { path: "/auth/login", label: "Login" },
      { path: "/auth/register", label: "Register" },
      { path: "/auth/forgot-password", label: "Forgot Password" },
      { path: "/auth/reset-password", label: "Reset Password" },
      { path: "/auth/verify-email", label: "Verify Email" },
    ],
  },
  {
    heading: "General",
    links: [
      { path: "/", label: "Home" },
      { path: "/join", label: "Join" },
      { path: "/sitemap", label: "Sitemap" },
    ],
  },
  {
    heading: "Test Taking",
    links: [
      { path: "/test/123", label: "Test Start Page" },
      { path: "/attempt/test/123/question/1", label: "Test Attempt Page" }
    ],
  },
];

export default function Site() {
  return (
    <div className="min-h-screen w-full p-8 py-12 bg-background text-foreground">
      <div className="max-w-3xl mx-auto space-y-8">
        {sitemap.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
            <ul className="space-y-1 pl-4 border-l border-border">
              {section.links.map(({ path, label }) => (
                <li key={path}>
                  <Link href={path} className="text-primary hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
