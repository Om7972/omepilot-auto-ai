import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DiscoverPanel } from "@/components/DiscoverPanel";

export default function Discover() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border p-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Discover</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <DiscoverPanel />
        </div>
      </div>
    </div>
  );
}