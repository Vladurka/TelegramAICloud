import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useAgentStore } from "../stores/useAgentStore";
import { Navbar } from "../components/Navbar";
import { Card, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../components/ui/button";

export const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const { agent, getAgentById, deleteAgent, unfreezeAgent, isLoading, error } =
    useAgentStore();

  useEffect(() => {
    if (!id || !user) return;
    getAgentById(parseInt(id), user.id);
  }, [id, getAgentById, user]);

  const handleDelete = async () => {
    if (!id || !user) return;
    const confirmed = confirm("Are you sure you want to delete this agent?");
    if (!confirmed) return;

    await deleteAgent(parseInt(id), user.id);
    navigate("/agents");
  };

  const handleUnfreeze = async () => {
    if (!id || !user) return;
    window.location.href = await unfreezeAgent(parseInt(id), user.id);
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen px-4 py-20 bg-background text-foreground flex justify-center">
        <Card className="w-full max-w-4xl p-8 space-y-8 mt-10 relative">
          {isLoading && (
            <p className="text-center text-muted-foreground">Loading...</p>
          )}
          {error && <p className="text-center text-red-500">{error}</p>}

          {agent && (
            <>
              <div className="text-center space-y-4">
                <CardTitle className="text-4xl font-bold">
                  {agent.name}
                </CardTitle>

                <div className="flex justify-center flex-wrap gap-3">
                  <Badge
                    variant="outline"
                    className={`text-sm px-4 py-1 rounded-full ${
                      agent.status === "active"
                        ? "text-green-500 border-green-500"
                        : "text-blue-400 border-blue-400"
                    }`}
                  >
                    {agent.status === "active" ? "Active" : "Frozen"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-sm px-4 py-1 rounded-full ${
                      agent.planType === "year"
                        ? "text-purple-500 border-purple-500"
                        : "text-indigo-500 border-indigo-500"
                    }`}
                  >
                    {agent.planType === "year" ? "Yearly" : "Monthly"}
                  </Badge>
                  <Badge className="text-sm px-4 py-1 rounded-full">
                    {agent.model}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl">
                <Label className="text-muted-foreground text-sm mb-2 block">
                  Prompt
                </Label>
                <p className="text-base">{agent.prompt}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                <div>
                  <Label className="text-muted-foreground text-sm mb-1 block">
                    Typing Time
                  </Label>
                  <p className="text-lg font-medium">
                    {agent.typingTime ?? 0} sec
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-1 block">
                    Reaction Time
                  </Label>
                  <p className="text-lg font-medium">
                    {agent.reactionTime ?? 0} sec
                  </p>
                </div>
                <div className="absolute bottom-6 right-6">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    onClick={handleDelete}
                  >
                    Delete Agent
                  </Button>
                </div>
                {agent.status === "frozen" && (
                  <div className="absolute bottom-6 left-6">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                      onClick={handleUnfreeze}
                    >
                      Unfreeze Agent
                    </Button>
                  </div>
                )}
                <div />
              </div>
            </>
          )}
        </Card>
      </section>
    </>
  );
};
