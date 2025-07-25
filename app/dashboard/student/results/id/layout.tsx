import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment Result | OnTest",
  description: "View your detailed assessment result",
};

export default function AttemptDetailLayout({
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