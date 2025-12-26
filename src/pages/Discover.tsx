import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DiscoverPanel } from "@/components/DiscoverPanel";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

export default function Discover() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border p-3 flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg hover:bg-muted"
            title="Toggle sidebar"
          >
            <PanelLeft className={`h-5 w-5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </Button>
          <h2 className="text-lg font-semibold">Discover</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <DiscoverPanel />
        </div>
      </div>
    </div>
  );
}
