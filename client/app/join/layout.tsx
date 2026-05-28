import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join a Contest",
  description: "Enter a contest join code to participate in real-time coding challenges and assessments.",
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
