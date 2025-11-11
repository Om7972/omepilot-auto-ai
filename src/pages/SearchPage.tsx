import { WebSearch } from "@/components/WebSearch";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function SearchPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 overflow-auto">
        <WebSearch />
      </div>
    </div>
  );
}