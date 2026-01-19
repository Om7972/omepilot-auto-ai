import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from '@supabase/supabase-js';
import { ArrowLeft, Mail } from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !username) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: username
          }
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully! Please check your email for confirmation.');
      }
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Sign up error:', authError);
      toast.error(authError.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success('Signed in successfully!');
        navigate('/');
      }
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Sign in error:', authError);
      if (authError.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else {
        toast.error(authError.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Reset password error:', authError);
      toast.error(authError.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-card">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img src={omepilotLogo} alt="Omepilot" className="w-16 h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {resetSent 
                ? "Check your email for the reset link"
                : "Enter your email to receive a password reset link"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetSent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{resetEmail}</strong>. 
                  Please check your inbox and spam folder.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetSent(false);
                    setResetEmail("");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full gap-2"
                  onClick={() => setShowResetPassword(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={omepilotLogo} alt="Omepilot" className="w-16 h-16" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Omepilot</CardTitle>
          <CardDescription>Your AI assistant powered by n8n automation</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setShowResetPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
