import { Metadata } from "next";
import { ClassMaterials } from "@/components/dashboard/student/class-materials";

export const metadata: Metadata = {
  title: "Class Materials | OnTest",
  description: "Study materials and resources for your class",
};

export default function ClassMaterialsPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Learning Materials</h1>
        <p className="text-muted-foreground">Access study materials and resources for your class.</p>
      </div>
      
      <ClassMaterials />
    </div>
  );
}