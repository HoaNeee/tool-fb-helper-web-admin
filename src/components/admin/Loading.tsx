import { Dialog, DialogContent } from "../ui/dialog";
import { Classic } from "./classic";

type LoadingProps = {
	fullScreen?: boolean;
	title?: string;
	size?: number;
	type?: "page" | "dialog" | "cover";
	blur?: boolean;
};

export default function Loading({
	fullScreen = true,
	title = "Đang tải...",
	size = 8,
	type,
	blur = false,
}: LoadingProps) {
	if (type === "dialog") {
		return (
			<Dialog open={true}>
				<DialogContent className={"w-45"} showCloseButton={false}>
					<div className="flex flex-col items-center justify-center gap-2">
						<Classic className="size-9" />
						<p className="text-sm">{title}</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (type === "cover") {
		return (
			<div
				className={`absolute inset-0 z-10 flex flex-col justify-center items-center ${
					blur ? "backdrop-blur-sm" : ""
				}`}
			>
				<div className="flex flex-col items-center justify-center gap-2 z-50">
					<Classic className="size-9" />
					<p className="text-sm">{title}</p>
				</div>
				<div className="w-full h-full absolute z-50"></div>
			</div>
		);
	}

	return (
		<div
			className={`${fullScreen ? "w-full h-dvh" : "w-full flex-1"} flex items-center justify-center`}
		>
			<div className="flex flex-col items-center justify-center">
				<Classic className={`size-${size}`} />
				<span className="text-slate-800 dark:text-slate-100 mt-2">{title}</span>
			</div>
		</div>
	);
}
