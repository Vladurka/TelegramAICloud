import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { SignInOAuthButton } from "./SignInOAuthButton";

export const Navbar = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="text-lg md:text-xl font-bold tracking-tight text-blue-400"
        >
          Telegram AI Cloud
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm md:text-base text-muted-foreground">
          <Link to="/docs" className="hover:text-primary transition-colors">
            Docs
          </Link>
          <a href="#pricing" className="hover:text-primary transition-colors">
            Pricing
          </a>
          <Link to="/contacts" className="hover:text-primary transition-colors">
            Contacts
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Button
                className="text-sm md:text-base px-4 md:px-6 py-2 cursor-pointer"
                onClick={() => navigate("/agents")}
              >
                Manage Agents
              </Button>
              <UserButton />
            </>
          ) : (
            <SignInOAuthButton />
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-background p-6 w-[75vw] sm:w-[50vw]"
            >
              <nav className="flex flex-col gap-6 mt-6 text-foreground text-base">
                <Link to="/docs">Docs</Link>
                <a href="#pricing">Pricing</a>
                <Link to="/contacts">Contacts</Link>

                {isSignedIn ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full mt-4 cursor-pointer"
                      onClick={() => navigate("/agents")}
                    >
                      Manage Agents
                    </Button>
                    <div className="mt-4">
                      <UserButton />
                    </div>
                  </>
                ) : (
                  <div className="mt-4">
                    <SignInOAuthButton />
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
