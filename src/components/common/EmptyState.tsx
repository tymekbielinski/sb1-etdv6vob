import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react"; // Or another suitable icon
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionLink?: string;
}

export function EmptyState({
  title = "No Activity Yet",
  message = "It looks like there's no activity logged for the selected period. Get started by adding your first entry!",
  actionText = "Log Your First Activity",
  actionLink = "/activity", // Assuming '/activity' is the route
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center h-[400px]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
        <FileTextIcon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-center text-sm leading-6 text-muted-foreground max-w-sm">
        {message}
      </p>
      <Button asChild className="mt-6">
        <Link to={actionLink}>{actionText}</Link>
      </Button>
    </div>
  );
}
