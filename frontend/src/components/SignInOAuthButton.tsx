import { useSignIn } from "@clerk/clerk-react";
import { useState } from "react";

export const SignInOAuthButton = () => {
  const { signIn, isLoaded } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded) return null;

  const signInWithGoogle = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/auth-callback",
      });
    } catch (error) {
      console.error("Error in sign in", error);
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={signInWithGoogle}
      disabled={isSubmitting || !isLoaded}
      className="px-4 py-2 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 transition-colors duration-300 cursor-pointer border-2"
    >
      {isSubmitting ? "Redirecting..." : "Sign in"}
    </button>
  );
};
