import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Navbar } from "../components/Navbar";
import { useAgentAuthStore } from "../stores/useAgentAuthStore";
import { useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const schema = z.object({
  clerkId: z.string().min(25).max(40).startsWith("user_"),
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),
  apiHash: z.string().min(20),
  phone: z.string().min(10).max(15),
});

export type TelegramFormInput = z.infer<typeof schema>;

export const GetTelegramCode = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TelegramFormInput>({
    resolver: zodResolver(schema),
  });

  const { getTelegramCode, isLoading, error, sessionString, phoneHash } =
    useAgentAuthStore();

  const navigate = useNavigate();
  const { user } = useUser();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!user) return;
    setValue("clerkId", user.id);
  }, [user, setValue]);

  const onSubmit = async (data: TelegramFormInput) => {
    await getTelegramCode(data);
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen px-6 py-20 bg-background text-foreground flex justify-center mt-10">
        <Card className="w-full max-w-xl h-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold">
              Get Telegram Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <p className="text-sm text-red-500">{errors.apiId.message}</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1">
                  <Label>API HASH</Label>
                  <Link to="/docs" target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                  </Link>
                </div>
                <Input type="text" {...register("apiHash")} />
                {errors.apiHash && (
                  <p className="text-sm text-red-500">
                    {errors.apiHash.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Phone Number</Label>
                <Input
                  type="tel"
                  {...register("phone")}
                  placeholder="+1234567890"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading || !isSignedIn}
              >
                {isLoading ? "Sending..." : "Send Code"}
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>

            {sessionString && phoneHash && (
              <div className="mt-6 space-y-4 bg-muted/40 p-4 rounded-lg border border-muted">
                <p className="text-green-600 font-medium">
                  Code was successfully sent. Save this data:
                </p>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Session String:
                  </Label>
                  <p className="break-all font-mono text-sm">{sessionString}</p>
                </div>

                <p className="text-yellow-600 text-sm">
                  ⚠️ Save it. You will need it to create your agent.
                </p>

                <Button
                  className="w-full bg-blue-400 hover:bg-blue-500 cursor-pointer"
                  onClick={() =>
                    navigate("/confirm-telegram-code", {
                      state: { allowed: true },
                    })
                  }
                >
                  Continue to Enter Code
                </Button>
              </div>
            )}
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
