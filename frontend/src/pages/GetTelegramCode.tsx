import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

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

const schema = z.object({
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
    formState: { errors },
  } = useForm<TelegramFormInput>({
    resolver: zodResolver(schema),
  });

  const { getTelegramCode, isLoading, error, sessionString, phoneHash } =
    useAgentAuthStore();

  const navigate = useNavigate();

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
                <Label className="mb-2 block">API ID</Label>
                <Input
                  type="number"
                  {...register("apiId", { valueAsNumber: true })}
                />
                {errors.apiId && (
                  <p className="text-sm text-red-500">{errors.apiId.message}</p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">API Hash</Label>
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
                disabled={isLoading}
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

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Phone Hash:
                  </Label>
                  <p className="break-all font-mono text-sm">{phoneHash}</p>
                </div>

                <p className="text-yellow-600 text-sm">
                  ⚠️ Save it. You will need it to create your agent.
                </p>

                <Button
                  className="w-full bg-blue-400 hover:bg-blue-500 cursor-pointer"
                  onClick={() => navigate("/confirm-telegram-code")}
                >
                  Continue to Enter Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
};
