import { Loader2 } from "lucide-react";

export const Loader = () => {
  return (
    <div className="flex justify-center mt-12 text-muted-foreground">
      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
      Loading agents...
    </div>
  );
};
