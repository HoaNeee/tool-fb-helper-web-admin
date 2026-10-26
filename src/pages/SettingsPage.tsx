import { PageHeading } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SettingsBundle } from "@/data/admin-data";
import type { Field, SettingGroup } from "@/data/setting-fields";
import { settingGroups } from "@/data/setting-fields";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";

type Draft = Record<string, string | boolean>;
function serialize(value: SettingsBundle[SettingGroup]): Draft {
	const draft = Object.fromEntries(
		Object.entries(value).map(([key, item]) => [
			key,
			typeof item === "boolean"
				? item
				: Array.isArray(item)
					? item.join("\n")
					: String(item),
		]),
	);
	return draft;
}

export default function SettingsPage({
	group,
	settings,
	onSave,
	onDirty,
}: {
	group: SettingGroup;
	settings: SettingsBundle;
	onSave: (_value: SettingsBundle) => void;
	onDirty: (_dirty: boolean) => void;
}) {
	const config = settingGroups[group];
	const fields: Field[] = config.fields;

	const [draft, setDraft] = useState<Draft>(() => serialize(settings[group]));
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDraft(serialize(settings[group]));
	}, [settings, group]);

	const dirty =
		JSON.stringify(draft) !== JSON.stringify(serialize(settings[group]));

	function update(key: string, value: string | boolean) {
		const next = { ...draft, [key]: value };
		setDraft(next);
		setErrors((prev) => ({ ...prev, [key]: "" }));
		onDirty(
			JSON.stringify(next) !== JSON.stringify(serialize(settings[group])),
		);
	}

	function save(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		const invalid: Record<string, string> = {};
		const result: Record<string, unknown> = { id: settings[group].id };

		for (const field of fields) {
			const raw = draft[field.key];
			const text = String(raw).trim();
			if (field.kind === "boolean") result[field.key] = Boolean(raw);
			else if (field.kind === "number") {
				const n = Number(text);
				if (
					!text ||
					!Number.isInteger(n) ||
					(field.min !== undefined && n < field.min) ||
					(field.max !== undefined && n > field.max)
				)
					invalid[field.key] =
						`Nhập số nguyên từ ${field.min ?? 0}${field.max === undefined ? " trở lên" : ` đến ${field.max}`}.`;
				result[field.key] = n;
			} else if (field.kind === "lines") {
				const lines = [
					...new Set(
						text
							.split("\n")
							.map((line) => line.trim())
							.filter(Boolean),
					),
				];
				if (
					field.urls &&
					lines.some((line) => {
						try {
							const url = new URL(line);
							return !["http:", "https:"].includes(url.protocol);
						} catch {
							return true;
						}
					})
				)
					invalid[field.key] = "Mỗi dòng phải là một URL HTTP/HTTPS hợp lệ.";
				result[field.key] = lines;
			} else {
				if (field.required && !text)
					invalid[field.key] = "Trường này không được để trống.";
				if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
					invalid[field.key] = "Nhập email hợp lệ.";
				result[field.key] = text;
			}
		}
		if (group === "post") {
			if (result.is_replace_image && !result.replace_image_value)
				invalid.replace_image_value = "Nhập giá trị ảnh khi bật thay thế ảnh.";
			if (result.is_replace_phone && !result.replace_phone_value)
				invalid.replace_phone_value =
					"Nhập số điện thoại khi bật thay thế số điện thoại.";
		}
		setErrors(invalid);
		if (Object.keys(invalid).length) return;
		// Field metadata is constrained to the schema keys; values are parsed above.
		const value = { ...settings, [group]: result } as SettingsBundle;
		setDraft(serialize(value[group]));
		onDirty(false);
		onSave(value);
	}

	return (
		<>
			<PageHeading title={config.title} description={config.description} />
			<form
				onSubmit={save}
				noValidate
				className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]"
			>
				<div>
					<section className="rounded-xl border bg-card">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
							<div>
								<h2 className="font-semibold">Thông số cấu hình</h2>
								<p className="mt-1 text-xs text-muted-foreground">
									Cập nhật thông tin cài đặt
								</p>
							</div>
							<span className="rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-xs text-muted-foreground">
								{settings[group].id}
							</span>
						</div>
						<div className="grid gap-6 p-5 sm:p-6">
							{fields.map((field) => (
								<div key={field.key}>
									{field.kind === "boolean" ? (
										<div className="flex items-center justify-between gap-6">
											<div>
												<label
													htmlFor={field.key}
													className="text-sm font-medium"
												>
													{field.label}
												</label>
												<p className="mt-1 text-xs text-muted-foreground">
													{field.description}
												</p>
											</div>
											<Switch
												id={field.key}
												checked={Boolean(draft[field.key])}
												onCheckedChange={(value) => update(field.key, value)}
											/>
										</div>
									) : (
										<label className="field-label mb-0" htmlFor={field.key}>
											{field.label}
											{field.kind === "lines" ? (
												<textarea
													id={field.key}
													className="textarea-control"
													rows={4}
													value={String(draft[field.key])}
													onChange={(e) => update(field.key, e.target.value)}
													aria-invalid={Boolean(errors[field.key])}
													aria-describedby={`${field.key}-help ${field.key}-error`}
												/>
											) : field.kind === "status" ? (
												<select
													id={field.key}
													className="select-control"
													value={String(draft[field.key])}
													onChange={(e) => update(field.key, e.target.value)}
												>
													<option value="ACTIVE">Đang bật (ACTIVE)</option>
													<option value="INACTIVE">Đã tắt (INACTIVE)</option>
													<option value="MAINTAINING">
														Bảo trì (MAINTAINING)
													</option>
												</select>
											) : (
												<Input
													id={field.key}
													className="h-10"
													type={
														field.kind === "number"
															? "number"
															: field.kind === "email"
																? "email"
																: "text"
													}
													min={field.min}
													max={field.max}
													step={field.kind === "number" ? 1 : undefined}
													required={field.required}
													value={String(draft[field.key])}
													onChange={(e) => update(field.key, e.target.value)}
													aria-invalid={Boolean(errors[field.key])}
													aria-describedby={`${field.key}-help ${field.key}-error`}
												/>
											)}
											{field.description && (
												<span
													id={`${field.key}-help`}
													className="text-xs font-normal leading-5 text-muted-foreground"
												>
													{field.description}
												</span>
											)}
										</label>
									)}
									{/* <p className="mt-2 font-mono text-[11px] text-muted-foreground">
										{field.key}
										{field.kind === "lines" ? " · string[]" : ""}
									</p> */}
									{errors[field.key] && (
										<p
											id={`${field.key}-error`}
											role="alert"
											className="mt-2 text-xs text-destructive"
										>
											{errors[field.key]}
										</p>
									)}
								</div>
							))}
						</div>
					</section>
					<div className="mt-5 flex flex-wrap items-center justify-end gap-3">
						<span
							className="mr-auto text-xs text-muted-foreground"
							aria-live="polite"
						>
							{dirty ? "Có thay đổi chưa lưu" : "Không có thay đổi chưa lưu"}
						</span>
						<Button
							type="button"
							variant="outline"
							disabled={!dirty}
							onClick={() => {
								setDraft(serialize(settings[group]));
								setErrors({});
								onDirty(false);
							}}
						>
							<RotateCcw size={14} />
							Hủy thay đổi
						</Button>
						<Button type="submit" disabled={!dirty}>
							<Save size={15} />
							Lưu cài đặt
						</Button>
					</div>
				</div>
			</form>
		</>
	);
}
