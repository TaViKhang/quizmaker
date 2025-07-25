"use client";

import { NavigationCompatibilityWrapper } from "../../components/navigation-compatibility-wrapper";

export default function TeacherResultsPage() {
  return (
    <NavigationCompatibilityWrapper redirectToNewRoutes={true}>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Redirecting to new grading system...</h1>
        <p>Please wait while we redirect you to the new grading system.</p>
      </div>
    </NavigationCompatibilityWrapper>
  );
} 