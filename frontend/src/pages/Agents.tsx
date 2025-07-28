import { useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Plus } from "lucide-react";
import { useAgentStore } from "../stores/useAgentStore";
import { Loader } from "../components/Loader";
import { useUser } from "@clerk/clerk-react";

export const Agents = () => {
  const { agentDTOs, getAgents, isLoading } = useAgentStore();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    getAgents(user.id);
  }, [getAgents, user]);

  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-background text-foreground px-6 py-24 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              My <span className="text-primary">AI Agents</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-3">
              Manage and monitor your autonomous Telegram assistants.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center mt-12 text-muted-foreground">
              <Loader />
              Loading agents...
            </div>
          ) : agentDTOs.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {agentDTOs.map((agent) => (
                <Card
                  key={agent.apiId}
                  className="w-[300px] border-border shadow-md hover:shadow-blue-500/10 transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-lg">
                        {agent.name}
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 ${
                            agent.status === "active"
                              ? "bg-green-600/20 text-green-400 border-green-600/30"
                              : "bg-blue-600/20 text-blue-400 border-blue-600/30"
                          }`}
                        >
                          {agent.status === "active" ? "Active" : "Frozen"}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 ${
                            agent.planType === "year"
                              ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                              : "bg-indigo-600/20 text-indigo-400 border-indigo-600/30"
                          }`}
                        >
                          {agent.planType === "year" ? "Yearly" : "Monthly"}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground mt-[-20px]">
                    This agent is configured to operate autonomously. You can
                    manage its settings or pause activity.
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <img
                src="/images/NoAgents.png"
                alt="No agents"
                className="w-58 h-58 mx-auto mb-6 opacity-60"
              />
              <p className="text-lg">You don't have any agents yet.</p>
              <p className="text-sm mt-2">
                Click “Create Agent” to get started.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-12">
          <Button
            size="lg"
            className="flex items-center gap-3 px-7 py-6 text-lg font-semibold shadow-xl hover:shadow-blue-500/20 transition-all duration-200 rounded-xl cursor-pointer"
          >
            <Plus />
            Create Agent
          </Button>
        </div>
      </section>
    </>
  );
};
