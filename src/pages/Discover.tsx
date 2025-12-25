import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DiscoverPanel } from "@/components/DiscoverPanel";

export default function Discover() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 overflow-hidden">
        <DiscoverPanel />
      </div>
    </div>
  );
}
