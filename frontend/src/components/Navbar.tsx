import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { SignInOAuthButton } from "./SignInOAuthButton";

export const Navbar = () => {
  const { isSignedIn } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold tracking-tight text-blue-400">
          Telegram AI Cloud
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="#features" className="hover:text-primary transition-colors">
            Features
          </Link>
          <Link to="#pricing" className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="#faq" className="hover:text-primary transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="hidden md:block">
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Button size="lg" className="text-base px-8 py-6 cursor-pointer">
                Manage Agents
              </Button>
              <UserButton />
            </div>
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
            <SheetContent side="right" className="bg-background">
              <nav className="flex flex-col gap-4 mt-8 text-foreground text-base items-center">
                <Link to="#features" className="">
                  Features
                </Link>
                <Link to="#pricing" className="">
                  Pricing
                </Link>
                <Link to="#faq" className="">
                  FAQ
                </Link>
                <Button className="mt-6 ">My Agents</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
