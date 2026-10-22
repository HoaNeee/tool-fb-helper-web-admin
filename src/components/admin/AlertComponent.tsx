import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AlertComponent({
  title,
  message,
  type,
  showIcon,
}: {
  title: string;
  message: string;
  type: "success" | "error";
  showIcon: boolean;
}) {
  const getStyle = () => {
    if (type === "success") {
      return "bg-background/50 border-green-500 text-green-500 dark:text-green-500 dark:bg-green-500/10";
    }
    return "bg-background/50 border-red-500 text-red-500 dark:text-red-500 dark:bg-red-500/10";
  };

  const gextTextColor = () => {
    if (type === "success") {
      return "text-green-500 dark:text-green-500 dark:bg-green-500/10";
    }
    return "text-red-500 dark:text-red-500 dark:bg-red-500/10";
  };

  return (
    <Alert className={getStyle()}>
      {showIcon ? <AlertIcon type={type} /> : null}
      <AlertTitle className="text-sm">{title}</AlertTitle>
      <AlertDescription className={gextTextColor()}>{message}</AlertDescription>
    </Alert>
  );
}

function AlertIcon({ type }: { type: "success" | "error" }) {
  if (type === "success") {
    return (
      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
}
