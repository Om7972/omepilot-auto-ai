import { MemoryManager } from "@/components/MemoryManager";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function MemoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 overflow-auto">
        <MemoryManager />
      </div>
    </div>
  );
}