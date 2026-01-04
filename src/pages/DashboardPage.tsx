import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { UserStatsCard } from "@/components/UserStatsCard";
import { UsageAnalytics } from "@/components/UsageAnalytics";
import { ProactiveSuggestions } from "@/components/ProactiveSuggestions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    checkAuth();
    loadUserName();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setIsLoading(false);
  };

  const loadUserName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      
      if (data?.username) {
        setUserName(data.username);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    navigate("/chat", { state: { initialMessage: suggestion } });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {userName}! Here's your overview.
              </p>
            </div>
            <Button onClick={() => navigate("/chat")} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Proactive Suggestions */}
          <ProactiveSuggestions onSuggestionClick={handleSuggestionClick} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Card */}
            <div className="lg:col-span-1">
              <UserStatsCard />
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Jump right into what you need</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "New Chat", path: "/chat", icon: "💬" },
                    { label: "Discover", path: "/discover", icon: "🔍" },
                    { label: "Memory", path: "/memory", icon: "🧠" },
                    { label: "Create", path: "/create-page", icon: "✨" },
                    { label: "Quiz", path: "/quiz", icon: "📝" },
                    { label: "Search", path: "/search", icon: "🌐" },
                    { label: "Gallery", path: "/creator-gallery", icon: "🎨" },
                    { label: "Settings", path: "/", icon: "⚙️" },
                  ].map((action) => (
                    <Button
                      key={action.path + action.label}
                      variant="outline"
                      className="h-20 flex-col gap-2 hover:bg-primary/10 hover:border-primary/30"
                      onClick={() => navigate(action.path)}
                    >
                      <span className="text-2xl">{action.icon}</span>
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analytics Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📊 Your Analytics
            </h2>
            <UsageAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
}
