import { WebSearch } from "@/components/WebSearch";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function SearchPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border p-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Web Search</h2>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <WebSearch />
        </div>
      </div>
    </div>
  );
}