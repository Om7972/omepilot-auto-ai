import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CreatorGallery } from "@/components/CreatorGallery";

export default function CreatorGalleryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 overflow-hidden">
        <CreatorGallery />
      </div>
    </div>
  );
}
