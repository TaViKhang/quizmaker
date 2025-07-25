import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Results | OnTest",
  description: "View your quiz and assessment results",
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
} 