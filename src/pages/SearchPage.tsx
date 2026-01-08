import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationSearch } from "@/components/ConversationSearch";
import { WebSearch } from "@/components/WebSearch";
import { Globe, MessageSquare } from "lucide-react";

export default function SearchPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border p-4">
          <h1 className="text-xl font-semibold">Search</h1>
          <p className="text-sm text-muted-foreground">Find conversations, messages, or search the web</p>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="conversations" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="conversations" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="web" className="gap-2">
                <Globe className="h-4 w-4" />
                Web Search
              </TabsTrigger>
            </TabsList>
            <TabsContent value="conversations">
              <ConversationSearch />
            </TabsContent>
            <TabsContent value="web">
              <WebSearch />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}