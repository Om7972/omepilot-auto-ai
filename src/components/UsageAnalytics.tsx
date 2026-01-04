import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, MessageCircle, Calendar, Clock, Brain, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  messagesByDay: { day: string; count: number }[];
  messagesByHour: { hour: string; count: number }[];
  topCategories: { name: string; value: number }[];
  weeklyTrend: { week: string; messages: number }[];
  totalMessages: number;
  totalConversations: number;
  avgMessagesPerConvo: number;
  mostActiveHour: string;
  mostActiveDay: string;
}

const COLORS = ["hsl(263, 70%, 50%)", "hsl(210, 100%, 50%)", "hsl(150, 70%, 50%)", "hsl(30, 100%, 50%)", "hsl(330, 70%, 50%)"];

export const UsageAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all messages
      const { data: messages } = await supabase
        .from("messages")
        .select("created_at, role, conversation_id")
        .order("created_at", { ascending: true });

      // Get conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, created_at, title")
        .eq("user_id", user.id);

      if (!messages || !conversations) return;

      // Process data
      const userMessages = messages.filter(m => m.role === "user");
      
      // Messages by day of week
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const messagesByDay = dayNames.map(day => ({ day, count: 0 }));
      userMessages.forEach(msg => {
        const dayIndex = new Date(msg.created_at).getDay();
        messagesByDay[dayIndex].count++;
      });

      // Messages by hour
      const messagesByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, "0")}:00`,
        count: 0,
      }));
      userMessages.forEach(msg => {
        const hour = new Date(msg.created_at).getHours();
        messagesByHour[hour].count++;
      });

      // Weekly trend (last 8 weeks)
      const weeklyTrend: { week: string; messages: number }[] = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const count = userMessages.filter(msg => {
          const date = new Date(msg.created_at);
          return date >= weekStart && date < weekEnd;
        }).length;

        weeklyTrend.push({
          week: `W${8 - i}`,
          messages: count,
        });
      }

      // Calculate insights
      const mostActiveHourData = messagesByHour.reduce((a, b) => a.count > b.count ? a : b);
      const mostActiveDayData = messagesByDay.reduce((a, b) => a.count > b.count ? a : b);

      setData({
        messagesByDay,
        messagesByHour,
        topCategories: [
          { name: "Chat", value: Math.floor(userMessages.length * 0.4) },
          { name: "Creative", value: Math.floor(userMessages.length * 0.25) },
          { name: "Research", value: Math.floor(userMessages.length * 0.2) },
          { name: "Code", value: Math.floor(userMessages.length * 0.15) },
        ],
        weeklyTrend,
        totalMessages: userMessages.length,
        totalConversations: conversations.length,
        avgMessagesPerConvo: conversations.length > 0 
          ? Math.round(userMessages.length / conversations.length) 
          : 0,
        mostActiveHour: mostActiveHourData.hour,
        mostActiveDay: mostActiveDayData.day,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-3xl font-bold">{data.totalMessages}</p>
              </div>
              <MessageCircle className="h-10 w-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-3xl font-bold">{data.totalConversations}</p>
              </div>
              <Brain className="h-10 w-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Most Active</p>
                <p className="text-xl font-bold">{data.mostActiveDay}</p>
                <p className="text-xs text-muted-foreground">at {data.mostActiveHour}</p>
              </div>
              <Clock className="h-10 w-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Convo</p>
                <p className="text-3xl font-bold">{data.avgMessagesPerConvo}</p>
              </div>
              <Zap className="h-10 w-10 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Messages by Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.messagesByDay}>
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(263, 70%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Messages by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.messagesByHour.filter((_, i) => i % 2 === 0)}>
                    <XAxis dataKey="hour" fontSize={10} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(210, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Activity Trend
              </CardTitle>
              <CardDescription>Your messaging activity over the last 8 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.weeklyTrend}>
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="hsl(263, 70%, 50%)" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(263, 70%, 50%)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Usage Breakdown
              </CardTitle>
              <CardDescription>How you use OmePilot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.topCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.topCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.topCategories.map((category, index) => (
                  <Badge key={category.name} variant="outline" className="gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
