import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Navbar } from "../components/Navbar";

import { useAgentAuthStore } from "../stores/useAgentAuthStore";
import { HelpCircle } from "lucide-react";

const confirmCodeSchema = z.object({
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),

  apiHash: z.string().min(30).max(40),
  phone: z.string().min(10).max(15),
  session: z.string().min(200).max(400),
  phoneCodeHash: z.string().min(15).max(30),
  code: z
    .number()
    .min(10000, "code must be a 5-digit number")
    .max(99999, "code must be a 5-digit number"),
  password: z.string().optional(),
});

export type ConfirmCodeInput = z.infer<typeof confirmCodeSchema>;

export const ConfirmTelegramCode = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmCodeInput>({
    resolver: zodResolver(confirmCodeSchema),
  });

  const {
    confirmTelegramCode,
    getTempData,
    apiId,
    apiHash,
    phone,
    phoneHash,
    isLoading,
    error,
  } = useAgentAuthStore();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const allowed = location.state?.allowed;

  if (!allowed) navigate("/");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => await getTempData(user.id);

    loadData();
  }, [user, getTempData]);

  useEffect(() => {
    if (!apiId || !apiHash || !phone || !phoneHash) return;

    setValue("apiId", apiId);
    setValue("apiHash", apiHash);
    setValue("phone", phone);
    setValue("phoneCodeHash", phoneHash);
  }, [apiHash, apiId, phone, phoneHash, setValue]);

  const onSubmit = async (data: ConfirmCodeInput) => {
    setSuccess(await confirmTelegramCode(data));
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen px-6 py-20 bg-background text-foreground flex justify-center mt-10">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold">
              Confirm Telegram Code
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <div className="mb-2 flex items-center gap-1">
                      <Label>API ID</Label>
                      <Link
                        to="/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                      </Link>
                    </div>
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

                <div>
                  <Label className="mb-2 block">Phone</Label>
                  <Input placeholder="+1234567890" {...register("phone")} />
                  {errors.phone && (
                    <p className="text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Session</Label>
                  <Input {...register("session")} />
                  {errors.session && (
                    <p className="text-sm text-red-500">
                      {errors.session.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Phone Code Hash</Label>
                  <Input {...register("phoneCodeHash")} />
                  {errors.phoneCodeHash && (
                    <p className="text-sm text-red-500">
                      {errors.phoneCodeHash.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Code</Label>
                  <Input
                    type="number"
                    {...register("code", { valueAsNumber: true })}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">
                    Password (if 2FA enabled)
                  </Label>
                  <Input type="password" {...register("password")} />
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting || isLoading || !isSignedIn}
                >
                  {isSubmitting || isLoading ? "Confirming..." : "Confirm Code"}
                </Button>
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-green-500 text-lg font-semibold">
                  ✅ Code confirmed successfully!
                </p>
                <p className="text-muted-foreground">
                  You can now continue to create your agent.
                </p>
                <Button
                  className="w-full cursor-pointer"
                  onClick={() =>
                    navigate("/create", {
                      state: { allowed: true },
                    })
                  }
                >
                  Continue to Create Agent
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
