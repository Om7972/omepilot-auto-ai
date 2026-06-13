import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, Users, MessageSquare, MessagesSquare, TrendingUp, ArrowLeft, ShieldCheck, ShieldOff } from "lucide-react";

interface Stats {
  total_users: number;
  total_conversations: number;
  total_messages: number;
  total_admins: number;
  messages_last_7d: number;
  new_users_last_7d: number;
  active_users_today: number;
}

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  created_at: string;
  is_admin: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      toast.error("Access denied: admins only");
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, adminLoading]);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.rpc("get_admin_stats"),
      supabase.from("profiles").select("id, username, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);

    if (statsRes.data) setStats(statsRes.data as unknown as Stats);
    const adminIds = new Set((rolesRes.data ?? []).map((r: any) => r.user_id));
    setUsers(
      (profilesRes.data ?? []).map((p: any) => ({ ...p, is_admin: adminIds.has(p.id) }))
    );
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Granted admin");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Revoked admin");
    }
    loadData();
  };

  if (adminLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users },
    { label: "Conversations", value: stats?.total_conversations ?? 0, icon: MessagesSquare },
    { label: "Messages", value: stats?.total_messages ?? 0, icon: MessageSquare },
    { label: "Admins", value: stats?.total_admins ?? 0, icon: Shield },
    { label: "Messages (7d)", value: stats?.messages_last_7d ?? 0, icon: TrendingUp },
    { label: "New Users (7d)", value: stats?.new_users_last_7d ?? 0, icon: Users },
    { label: "Active Today", value: stats?.active_users_today ?? 0, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Badge variant="secondary">Admin</Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username || "—"}</TableCell>
                      <TableCell>{u.full_name || "—"}</TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.is_admin ? (
                          <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, false)}>
                            <ShieldOff className="h-3 w-3 mr-1" />Revoke
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => toggleAdmin(u.id, true)}>
                            <ShieldCheck className="h-3 w-3 mr-1" />Make Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
