import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Image as ImageIcon, FileText, Code, Sparkles, Zap, MessageSquare } from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingParticles } from "@/components/landing/FloatingParticles";

const features = [
  { icon: Brain, title: "Smart AI Chat", description: "Multi-model AI with context-aware responses" },
  { icon: ImageIcon, title: "Image Generation", description: "Create stunning visuals instantly" },
  { icon: FileText, title: "Document Analysis", description: "Extract insights from any document" },
  { icon: Code, title: "Code Assistant", description: "Full-stack development support" },
  { icon: Sparkles, title: "Web Search", description: "Real-time, cited answers from the web" },
  { icon: Zap, title: "Voice & TTS", description: "Talk to Omepilot, hear it talk back" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goToApp = () => navigate(user ? "/chat" : "/auth");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <FloatingParticles />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={omepilotLogo} alt="Omepilot" className="w-10 h-10" />
          <span className="text-xl font-semibold tracking-tight">Omepilot</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/pricing")}>Pricing</Button>
          <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
          <Button onClick={goToApp} className="gap-2">
            Get started <ArrowRight className="w-4 h-4" />
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur text-sm text-muted-foreground mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Your everyday AI copilot
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
        >
          Think faster.<br />
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Create boldly.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Chat, search, generate images, analyze documents and write code — all from a single,
          beautifully simple workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" onClick={goToApp} className="gap-2 h-12 px-6 text-base">
            <MessageSquare className="w-4 h-4" /> Start chatting free
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="h-12 px-6 text-base">
            See pricing
          </Button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group p-6 rounded-2xl border border-border bg-card/50 backdrop-blur hover:border-primary/40 hover:bg-card transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 pb-24 text-center">
        <div className="p-10 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card/50 to-transparent backdrop-blur">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready when you are.</h2>
          <p className="text-muted-foreground mb-6">Create your account and meet your new copilot in seconds.</p>
          <Button size="lg" onClick={goToApp} className="gap-2 h-12 px-6 text-base">
            Get started <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Omepilot. All rights reserved.
      </footer>
    </div>
  );
}
