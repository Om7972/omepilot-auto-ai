import { QuizGenerator } from "@/components/QuizGenerator";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function QuizPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border p-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Quiz Generator</h2>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <QuizGenerator />
        </div>
      </div>
    </div>
  );
}