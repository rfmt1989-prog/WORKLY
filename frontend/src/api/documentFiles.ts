import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { api } from "./client";

export const MAX_WORKLY_FILE_BYTES = 2 * 1024 * 1024;

export type PickedWorklyFile = {
  name: string;
  contentType: string;
  size: number;
  base64: string;
};

export type StoredDocumentResponse = {
  document: {
    id: string;
    owner_type: "worker" | "company" | "project";
    owner_id: string;
    title: string;
    category: string;
    file_name: string;
    status: string;
    updated_at: string;
    demo_content: string;
    file_id: string;
    content_type: string;
    size_bytes: number;
    expires_at?: string;
  };
};

type StoredFileContent = {
  file_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  content_base64: string;
};

function readBrowserFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

export async function pickWorklyFile(): Promise<PickedWorklyFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets.length) return null;

  const asset = result.assets[0];
  const size = Number(asset.size ?? 0);
  if (size > MAX_WORKLY_FILE_BYTES) {
    throw new Error("WORKLY_FILE_TOO_LARGE");
  }
  const contentType = asset.mimeType || "application/octet-stream";
  const base64 =
    Platform.OS === "web" && asset.file
      ? await readBrowserFile(asset.file)
      : await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

  return {
    name: asset.name || `workly-${Date.now()}`,
    contentType,
    size: size || Math.floor((base64.length * 3) / 4),
    base64,
  };
}

export async function uploadWorklyFile(input: {
  owner_type: "worker" | "company" | "project";
  owner_id: string;
  title: string;
  category: string;
  expires_at?: string;
  file: PickedWorklyFile;
}): Promise<StoredDocumentResponse> {
  return api.post<StoredDocumentResponse>("/files", {
    owner_type: input.owner_type,
    owner_id: input.owner_id,
    title: input.title,
    category: input.category,
    expires_at: input.expires_at || null,
    file_name: input.file.name,
    content_type: input.file.contentType,
    content_base64: input.file.base64,
  });
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100) || "workly-file";
}

export async function openWorklyFile(fileId: string): Promise<void> {
  const stored = await api.get<StoredFileContent>(`/files/${fileId}/content`);
  if (Platform.OS === "web") {
    const blob = base64ToBlob(stored.content_base64, stored.content_type);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new Error("WORKLY_FILE_CACHE_UNAVAILABLE");
  const uri = `${directory}${Date.now()}-${safeFileName(stored.file_name)}`;
  await FileSystem.writeAsStringAsync(uri, stored.content_base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: stored.content_type,
      dialogTitle: stored.file_name,
    });
    return;
  }
  throw new Error("WORKLY_SHARING_UNAVAILABLE");
}
