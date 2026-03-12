import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Zap,
  Sparkles,
  Crown,
  ArrowRight,
  MessageSquare,
  Brain,
  Users,
  FileText,
  Image,
  Code,
  Shield,
  Headphones,
  BarChart3,
  Globe,
} from "lucide-react";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with AI-powered conversations",
    icon: Zap,
    cta: "Get Started",
    ctaVariant: "outline" as const,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For power users who need unlimited access and premium features",
    icon: Sparkles,
    popular: true,
    cta: "Upgrade to Pro",
    ctaVariant: "default" as const,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "Tailored solutions for teams and organizations",
    icon: Crown,
    cta: "Contact Sales",
    ctaVariant: "secondary" as const,
  },
];

interface FeatureRow {
  feature: string;
  category: string;
  free: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

const features: FeatureRow[] = [
  { category: "Usage", feature: "Daily messages", free: "25/day", pro: "Unlimited", enterprise: "Unlimited" },
  { category: "Usage", feature: "Conversations", free: "5 active", pro: "Unlimited", enterprise: "Unlimited" },
  { category: "Usage", feature: "File uploads", free: "10 MB/file", pro: "50 MB/file", enterprise: "500 MB/file" },
  { category: "AI Models", feature: "Quick Response (Gemini)", free: true, pro: true, enterprise: true },
  { category: "AI Models", feature: "Groq-4-fast", free: true, pro: true, enterprise: true },
  { category: "AI Models", feature: "GPT-5 (Smart)", free: false, pro: true, enterprise: true },
  { category: "AI Models", feature: "Think Deeper (Claude)", free: false, pro: true, enterprise: true },
  { category: "AI Models", feature: "Deep Think Persona", free: false, pro: true, enterprise: true },
  { category: "AI Models", feature: "Study Persona", free: false, pro: true, enterprise: true },
  { category: "Creation", feature: "AI Document Generation", free: false, pro: true, enterprise: true },
  { category: "Creation", feature: "AI Image Generation", free: false, pro: true, enterprise: true },
  { category: "Creation", feature: "Code Assistant", free: false, pro: true, enterprise: true },
  { category: "Collaboration", feature: "Collaborative sessions", free: false, pro: true, enterprise: true },
  { category: "Collaboration", feature: "Team members", free: false, pro: "Up to 10", enterprise: "Unlimited" },
  { category: "Features", feature: "Memory & Context", free: true, pro: true, enterprise: true },
  { category: "Features", feature: "Quiz Generation", free: false, pro: true, enterprise: true },
  { category: "Features", feature: "Document Analysis", free: false, pro: true, enterprise: true },
  { category: "Features", feature: "Web Search", free: true, pro: true, enterprise: true },
  { category: "Features", feature: "Voice Input", free: true, pro: true, enterprise: true },
  { category: "Features", feature: "Export Conversations", free: true, pro: true, enterprise: true },
  { category: "Support", feature: "Community support", free: true, pro: true, enterprise: true },
  { category: "Support", feature: "Priority support", free: false, pro: true, enterprise: true },
  { category: "Support", feature: "Dedicated account manager", free: false, pro: false, enterprise: true },
  { category: "Enterprise", feature: "SSO / SAML", free: false, pro: false, enterprise: true },
  { category: "Enterprise", feature: "API access", free: false, pro: false, enterprise: true },
  { category: "Enterprise", feature: "Custom AI training", free: false, pro: false, enterprise: true },
  { category: "Enterprise", feature: "Analytics dashboard", free: false, pro: false, enterprise: true },
  { category: "Enterprise", feature: "Custom integrations", free: false, pro: false, enterprise: true },
];

const categoryIcons: Record<string, React.ElementType> = {
  Usage: BarChart3,
  "AI Models": Brain,
  Creation: FileText,
  Collaboration: Users,
  Features: Sparkles,
  Support: Headphones,
  Enterprise: Shield,
};

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm font-medium">{value}</span>;
}

export default function PricingPage() {
  const navigate = useNavigate();

  const handleCta = (planKey: string) => {
    if (planKey === "enterprise") {
      navigate("/contact-support");
    } else {
      navigate("/auth");
    }
  };

  const categories = [...new Set(features.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl text-foreground">
            <Sparkles className="h-6 w-6 text-primary" />
            OmePilot
          </button>
          <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
            Sign In <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center px-4">
        <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
          Simple, transparent pricing
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto">
          Choose the plan that fits your workflow
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free. Upgrade when you need unlimited power, premium AI models, and advanced creation tools.
        </p>
      </section>

      {/* Plan Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative transition-all ${
                plan.popular
                  ? "border-primary shadow-xl ring-2 ring-primary/20 scale-[1.02]"
                  : "border-border hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pt-8 pb-2">
                <plan.icon
                  className={`h-10 w-10 mx-auto mb-3 ${
                    plan.popular ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <Button
                  variant={plan.ctaVariant}
                  className="w-full gap-2"
                  onClick={() => handleCta(plan.key)}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-2 text-foreground">Feature Comparison</h2>
        <p className="text-center text-muted-foreground mb-10">
          Everything you get with each plan, side by side.
        </p>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%] font-semibold text-foreground">Feature</TableHead>
                <TableHead className="text-center font-semibold text-foreground">Free</TableHead>
                <TableHead className="text-center font-semibold text-primary">
                  Pro
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const Icon = categoryIcons[category] || Sparkles;
                const categoryFeatures = features.filter((f) => f.category === category);
                return (
                  <>
                    <TableRow key={`cat-${category}`} className="bg-muted/30">
                      <TableCell colSpan={4} className="py-2">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          {category}
                        </div>
                      </TableCell>
                    </TableRow>
                    {categoryFeatures.map((row) => (
                      <TableRow key={row.feature}>
                        <TableCell className="text-muted-foreground">{row.feature}</TableCell>
                        <TableCell className="text-center">
                          <CellValue value={row.free} />
                        </TableCell>
                        <TableCell className="text-center bg-primary/[0.02]">
                          <CellValue value={row.pro} />
                        </TableCell>
                        <TableCell className="text-center">
                          <CellValue value={row.enterprise} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10 text-foreground">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Can I switch plans anytime?",
              a: "Yes! You can upgrade or downgrade at any time. When upgrading, you'll get immediate access to all Pro features. Downgrades take effect at the end of your billing cycle.",
            },
            {
              q: "What happens when I hit the daily message limit?",
              a: "Free users get 25 messages per day. Once you reach the limit, you'll see an upgrade prompt. The counter resets at midnight. Pro users have unlimited messages.",
            },
            {
              q: "Is there a free trial for Pro?",
              a: "We don't offer a free trial, but you can start with the Free plan and upgrade whenever you're ready. There's no commitment — cancel anytime.",
            },
            {
              q: "How does Enterprise pricing work?",
              a: "Enterprise pricing is customized based on your team size, usage needs, and required integrations. Contact our sales team for a personalized quote.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, debit cards, and most international payment methods through our secure payment processor.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground">{q}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-border bg-muted/30 py-16 text-center px-4">
        <h2 className="text-2xl font-bold text-foreground">Ready to supercharge your workflow?</h2>
        <p className="mt-2 text-muted-foreground">Join thousands of users already using OmePilot.</p>
        <Button onClick={() => navigate("/auth")} className="mt-6 gap-2" size="lg">
          <Sparkles className="h-5 w-5" />
          Get Started Free
        </Button>
      </section>
    </div>
  );
}
