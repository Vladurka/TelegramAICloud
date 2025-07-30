import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAgentStore } from "../stores/useAgentStore";
import { Navbar } from "../components/Navbar";
import { Card, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useUser } from "@clerk/clerk-react";

const schema = z.object({
  clerkId: z.string().min(25).max(40).startsWith("user_"),
  apiId: z.number().min(10000000).max(99999999),
  prompt: z.string().min(1).max(1000),
  typingTime: z.number().min(0).max(10),
  reactionTime: z.number().min(0).max(120),
});

export type AgentUpdateInput = z.infer<typeof schema>;

export const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [succeeded, setSucceeded] = useState(false);

  const {
    agent,
    getAgentById,
    deleteAgent,
    unfreezeAgent,
    updateAgent,
    isLoading,
    error,
  } = useAgentStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AgentUpdateInput>({
    resolver: zodResolver(schema),
  });

  const watched = watch();

  useEffect(() => {
    if (!id || !user) return;
    getAgentById(parseInt(id), user.id);
  }, [id, user, getAgentById]);

  useEffect(() => {
    if (!agent || !id || !user) return;
    setValue("clerkId", user.id);
    setValue("apiId", parseInt(id));
    setValue("prompt", agent.prompt);
    setValue("typingTime", agent.typingTime ?? 0);
    setValue("reactionTime", agent.reactionTime ?? 0);
  }, [agent, user, setValue, id]);

  const isUnchanged = useMemo(() => {
    if (!agent) return true;
    return (
      watched.prompt === agent.prompt &&
      watched.typingTime === (agent.typingTime ?? 0) &&
      watched.reactionTime === (agent.reactionTime ?? 0)
    );
  }, [watched, agent]);

  useEffect(() => {
    if (succeeded) {
      const timeout = setTimeout(() => setSucceeded(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [succeeded]);

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

  const onSubmit = async (data: AgentUpdateInput) => {
    if (!id || !user) return;
    const success = await updateAgent(data);
    setSucceeded(success);

    if (success) {
      await getAgentById(parseInt(id), user.id);
    }
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
                  {agent.planType && (
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
                  )}
                  <Badge className="text-sm px-4 py-1 rounded-full">
                    {agent.model}
                  </Badge>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">
                    Prompt
                  </Label>
                  <Textarea {...register("prompt")} />
                  {errors.prompt && (
                    <p className="text-sm text-red-500">
                      {errors.prompt.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-1 block">
                      Typing Time
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      {...register("typingTime", { valueAsNumber: true })}
                    />
                    {errors.typingTime && (
                      <p className="text-sm text-red-500">
                        {errors.typingTime.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-1 block">
                      Reaction Time
                    </Label>
                    <Input
                      type="number"
                      {...register("reactionTime", { valueAsNumber: true })}
                    />
                    {errors.reactionTime && (
                      <p className="text-sm text-red-500">
                        {errors.reactionTime.message}
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUnchanged}
                    className="cursor-pointer"
                  >
                    {isSubmitting ? "Updating..." : "Update Agent"}
                  </Button>
                </div>

                {succeeded && (
                  <p className="text-sm text-green-500 text-center">
                    Agent updated successfully!
                  </p>
                )}
              </form>

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
            </>
          )}
        </Card>
      </section>
    </>
  );
};
