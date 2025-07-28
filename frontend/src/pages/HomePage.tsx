import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Bot, Rocket, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HomePage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-background text-foreground px-6 py-24">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight sm:text-6xl mb-6">
            Supercharge Your Telegram with
            <br />
            <span className="text-blue-400">AI Agents</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Deploy autonomous AI agents that run 24/7 inside your Telegram
            account.
            <br /> No coding. Full control. Instant results.
          </p>
          <Button
            size="lg"
            className="text-base px-8 py-6 cursor-pointer"
            onClick={() => navigate("/create")}
          >
            🚀 Launch Your First Agent
          </Button>
        </div>

        <div className="mt-20 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
          <Card className="bg-card border border-border shadow-xl hover:shadow-blue-500/10 transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-semibold text-center">
                Persistent Agents
              </CardTitle>
              <CardDescription className="text-center">
                Always-on AI that handles tasks, answers, and automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              Deploy once and your agent runs around the clock — no maintenance
              needed.
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-xl hover:shadow-blue-500/10 transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
                <Rocket className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-semibold text-center">
                Instant Launch
              </CardTitle>
              <CardDescription className="text-center">
                Set up in minutes. No code, no friction — just Telegram.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              Connect your account and go live faster than ever before.
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-xl hover:shadow-blue-500/10 transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
                <Settings2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-semibold text-center">
                Custom Behavior
              </CardTitle>
              <CardDescription className="text-center">
                Define how your agents think and act — your rules, your logic.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              Fully configurable flows, conditions, and responses.
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};
