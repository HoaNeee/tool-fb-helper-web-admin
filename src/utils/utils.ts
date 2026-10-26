const MAX_LENGTH_FILE_NAME = 15;
export type TypeBase64 = {
	name: string;
	base64Data: string;
	type: string;
};

function genID(length: number = 10) {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(random(0, characters.length - 1));
	}
	return result;
}

function randomString(length = 16) {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(random(0, characters.length - 1));
	}
	return result;
}

function random(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDayOfWeekText({ day }: { day: number }) {
	switch (day) {
		case 0:
			return "Sunday";
		case 1:
			return "Monday";
		case 2:
			return "Tuesday";
		case 3:
			return "Wednesday";
		case 4:
			return "Thursday";
		case 5:
			return "Friday";
		case 6:
			return "Saturday";
		default:
			return "";
	}
}

async function parseUrlToBlob(url: string) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.blob();
	} catch (error) {
		throw error;
	}
}

function parseBlobToFile(blob: Blob, name: string | null = null) {
	let fileName = genID();
	const ext = getExtensionByMimeType(blob.type);

	if (name) {
		const split = name?.split(".");
		if (split.length > 1) {
			const origin = split[0];
			if (origin.includes("//")) {
				fileName = origin.slice(origin.lastIndexOf("/") + 1);
			} else {
				fileName = origin;
			}
		}

		if (fileName.length > MAX_LENGTH_FILE_NAME) {
			fileName = fileName.slice(0, MAX_LENGTH_FILE_NAME);
		}
	}

	fileName = fileName.replaceAll(/[-_./"]/g, "");

	//convert name again
	const newName = fileName + "_" + genID() + "." + ext;

	return new File([blob], newName, { type: blob.type });
}

function getExtensionByMimeType(mimeType: string) {
	const mimeTypes = {
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/bmp": "bmp",
		"image/svg+xml": "svg",
		"image/tiff": "tif",
		"image/vnd.microsoft.icon": "ico",
		"image/apng": "apng",
		"image/avif": "avif",
		"image/x-icon": "ico",
	};

	return mimeTypes[mimeType?.toLowerCase()] || "jpg";
}

async function parseFileToObjectBase64(file: File) {
	const base64Data = await fileToBase64(file);
	return {
		name: file.name,
		base64Data,
		type: file.type,
	} as TypeBase64;
}

async function fileToBase64(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
		reader.readAsDataURL(file);
	});
}

function parseBase64ToFile(objectBase64: TypeBase64) {
	const { name, base64Data, type } = objectBase64;
	const blob = parseBase64ToBlob({ name, base64Data, type });

	const split = name?.split(".");

	let fileName = genID();
	let ext = "jpg";

	if (split.length > 1) {
		fileName = split[0];
		ext = split[split.length - 1];
	}

	if (fileName.length > MAX_LENGTH_FILE_NAME) {
		fileName = fileName.slice(0, MAX_LENGTH_FILE_NAME);
	}

	//convert name again
	const newName = fileName + "_" + genID() + "." + ext;
	const file = new File([blob], newName, { type });
	return file;
}

function parseBase64ToBlob(objectBase64: TypeBase64): Blob {
	const base64Data = objectBase64.base64Data.split(",")[1];
	const binaryData = atob(base64Data);
	const len = binaryData.length;
	const uint8Array = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		uint8Array[i] = binaryData.charCodeAt(i);
	}
	const blob = new Blob([uint8Array], { type: objectBase64.type });

	return blob;
}

function cloneObject<T>(object: T): T {
	const clone: unknown = {};
	for (const key in object) {
		if (object[key] && typeof object[key] === "object") {
			if (Array.isArray(object[key])) {
				clone[key] = [...object[key]];
			} else {
				clone[key] = cloneObject(object[key]);
			}
		} else {
			clone[key] = object[key];
		}
	}
	return clone as T;
}

export {
	genID,
	random,
	randomString,
	sleep,
	getDayOfWeekText,
	parseUrlToBlob,
	parseBlobToFile,
	parseFileToObjectBase64,
	parseBase64ToFile,
	parseBase64ToBlob,
	cloneObject,
};
