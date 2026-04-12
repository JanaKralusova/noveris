import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

export async function ensureDataDir(): Promise<void> {
  const dir = await appDataDir();
  const dirExists = await exists(dir);
  if (!dirExists) {
    await mkdir(dir, { recursive: true });
  }
}

export async function readJsonl<T>(filename: string): Promise<T[]> {
  try {
    const content = await readTextFile(filename, {
      baseDir: BaseDirectory.AppData,
    });
    return content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

export async function writeJsonl<T>(
  filename: string,
  data: T[]
): Promise<void> {
  const content = data.length > 0 ? data.map((item) => JSON.stringify(item)).join("\n") : "";
  await writeTextFile(filename, content, {
    baseDir: BaseDirectory.AppData,
  });
}

export async function readJson<T>(filename: string): Promise<T | null> {
  try {
    const content = await readTextFile(filename, {
      baseDir: BaseDirectory.AppData,
    });
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeTextFile(filename, content, {
    baseDir: BaseDirectory.AppData,
  });
}
