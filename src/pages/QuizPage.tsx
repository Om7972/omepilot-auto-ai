import { QuizGenerator } from "@/components/QuizGenerator";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function QuizPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 overflow-auto">
        <QuizGenerator />
      </div>
    </div>
  );
}