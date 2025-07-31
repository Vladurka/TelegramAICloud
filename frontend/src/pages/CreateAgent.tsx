import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Navbar } from "../components/Navbar";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAgentStore } from "../stores/useAgentStore";
import { useAgentAuthStore } from "../stores/useAgentAuthStore";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const allowedModels = ["gpt-3.5-turbo"];

const createAgentSchema = z.object({
  clerkId: z.string().min(25).max(40).startsWith("user_"),
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),

  apiHash: z.string().min(30).max(40),
  sessionString: z.string().min(200).max(400),
  prompt: z.string().min(1).max(1000),

  typingTime: z.number().min(0).max(10).default(0).optional(),
  reactionTime: z.number().min(0).max(120).default(0).optional(),

  model: z.enum(allowedModels).default(allowedModels[0]).optional(),

  name: z.string().min(1).max(40),
  planType: z.enum(["month", "year"]),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const CreateAgent = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
  });

  const { user } = useUser();
  const { createAgent, error } = useAgentStore();
  const { getTempData, apiId, apiHash } = useAgentAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const allowed = location.state?.allowed;
  const { isSignedIn } = useAuth();

  if (!allowed) navigate("/");

  useEffect(() => {
    if (!user) return;
    setValue("clerkId", user.id);
    setValue("planType", "year");
    setValue("model", allowedModels[0]);
  }, [setValue, user]);

  useEffect(() => {
    if (!user) return;

    const loadAndSet = async () => {
      await getTempData(user.id);

      if (apiId && apiHash) {
        setValue("apiId", apiId);
        setValue("apiHash", apiHash);
      }
    };

    loadAndSet();
  }, [user, getTempData, apiId, apiHash, setValue]);

  const onSubmit = async (data: CreateAgentInput) => {
    if (isSignedIn) window.location.href = await createAgent(data);
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen px-6 py-30 bg-background text-foreground flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Create Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex space-x-8">
                <div>
                  <Label className="mb-2 block">Name</Label>
                  <Input {...register("name")} placeholder="TestAgent" />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Plan</Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("planType", value as "month" | "year");
                      console.log("Selected planType:", value);
                    }}
                    defaultValue="year"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly – $10</SelectItem>
                      <SelectItem value="year">Yearly – $100</SelectItem>
                    </SelectContent>
                  </Select>

                  {errors.planType && (
                    <p className="text-sm text-red-500">
                      {errors.planType.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Model</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("model", value as (typeof allowedModels)[number])
                    }
                    defaultValue={allowedModels[0]}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.model && (
                    <p className="text-sm text-red-500">
                      {errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <Label>API ID</Label>
                    <Link to="/docs" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                    </Link>
                  </div>
                  <Input
                    type="number"
                    {...register("apiId", { valueAsNumber: true })}
                  />

                  {errors.apiId && (
                    <p className="text-sm text-red-500">
                      {errors.apiId.message}
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <Label>API HASH</Label>
                    <Link to="/docs" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                    </Link>
                  </div>
                  <Input {...register("apiHash")} />
                  {errors.apiHash && (
                    <p className="text-sm text-red-500">
                      {errors.apiHash.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-2">Session String</Label>
                <Textarea rows={3} {...register("sessionString")} />
                {errors.sessionString && (
                  <p className="text-sm text-red-500">
                    {errors.sessionString.message}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1">
                  <Label>Prompt</Label>
                  <Link to="/docs" target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                  </Link>
                </div>
                <Textarea
                  {...register("prompt")}
                  placeholder="What should this agent do?"
                />
                {errors.prompt && (
                  <p className="text-sm text-red-500">
                    {errors.prompt.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <Label>Typing Time</Label>
                    <Link to="/docs" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                    </Link>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    {...register("typingTime", { valueAsNumber: true })}
                    defaultValue={0}
                  />
                  {errors.typingTime && (
                    <p className="text-sm text-red-500">
                      {errors.typingTime.message}
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <Label>Reaction Time</Label>
                    <Link to="/docs" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                    </Link>
                  </div>
                  <Input
                    type="number"
                    step="1"
                    {...register("reactionTime", { valueAsNumber: true })}
                    defaultValue={0}
                  />
                  {errors.reactionTime && (
                    <p className="text-sm text-red-500">
                      {errors.reactionTime.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isSubmitting || !isSignedIn}
              >
                {isSubmitting ? "Creating..." : "Create Agent"}
              </Button>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </form>
            {!isSignedIn && (
              <div className="mt-6 space-y-4 bg-muted/40 p-4 rounded-lg border border-muted">
                <p className="text-yellow-600 font-medium">
                  You are not signed in. Please sign in to get Telegram code.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
};
