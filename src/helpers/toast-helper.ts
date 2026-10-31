import { toast } from "@/components/ui/toast";

interface Props {
  title?: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
}

function showToast({ title = "", description = "", type = "info" }: Props) {
  toast.add({
    title,
    description,
    type,
  });
}

export default showToast;
