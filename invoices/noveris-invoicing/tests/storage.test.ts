import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @tauri-apps/plugin-fs
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  mkdir: vi.fn(),
  exists: vi.fn(),
  BaseDirectory: {
    AppData: "AppData",
  },
}));

// Mock @tauri-apps/api/path
vi.mock("@tauri-apps/api/path", () => ({
  appDataDir: vi.fn().mockResolvedValue("/mock/app/data"),
}));

import {
  readJsonl,
  writeJsonl,
  readJson,
  writeJson,
  ensureDataDir,
} from "../src/lib/storage";
import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
} from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

const mockReadTextFile = vi.mocked(readTextFile);
const mockWriteTextFile = vi.mocked(writeTextFile);
const mockExists = vi.mocked(exists);
const mockMkdir = vi.mocked(mkdir);
const mockAppDataDir = vi.mocked(appDataDir);

beforeEach(() => {
  vi.clearAllMocks();
  mockAppDataDir.mockResolvedValue("/mock/app/data");
});

describe("readJsonl", () => {
  it("parses valid JSONL content", async () => {
    mockReadTextFile.mockResolvedValue('{"id":"1","name":"A"}\n{"id":"2","name":"B"}');
    const result = await readJsonl<{ id: string; name: string }>("test.jsonl");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1", name: "A" });
    expect(result[1]).toEqual({ id: "2", name: "B" });
  });

  it("returns empty array for missing file", async () => {
    mockReadTextFile.mockRejectedValue(new Error("File not found"));
    const result = await readJsonl("missing.jsonl");
    expect(result).toEqual([]);
  });

  it("skips empty lines", async () => {
    mockReadTextFile.mockResolvedValue('{"id":"1"}\n\n{"id":"2"}\n');
    const result = await readJsonl<{ id: string }>("test.jsonl");
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty file", async () => {
    mockReadTextFile.mockResolvedValue("");
    const result = await readJsonl("empty.jsonl");
    expect(result).toEqual([]);
  });
});

describe("writeJsonl", () => {
  it("serializes items to JSONL format", async () => {
    mockWriteTextFile.mockResolvedValue(undefined);
    const data = [{ id: "1", name: "A" }, { id: "2", name: "B" }];
    await writeJsonl("test.jsonl", data);
    expect(mockWriteTextFile).toHaveBeenCalledWith(
      "test.jsonl",
      '{"id":"1","name":"A"}\n{"id":"2","name":"B"}',
      expect.any(Object)
    );
  });

  it("writes empty string for empty array", async () => {
    mockWriteTextFile.mockResolvedValue(undefined);
    await writeJsonl("test.jsonl", []);
    expect(mockWriteTextFile).toHaveBeenCalledWith(
      "test.jsonl",
      "",
      expect.any(Object)
    );
  });
});

describe("readJson", () => {
  it("parses valid JSON content", async () => {
    mockReadTextFile.mockResolvedValue('{"key":"value","num":42}');
    const result = await readJson<{ key: string; num: number }>("settings.json");
    expect(result).toEqual({ key: "value", num: 42 });
  });

  it("returns null for missing file", async () => {
    mockReadTextFile.mockRejectedValue(new Error("File not found"));
    const result = await readJson("missing.json");
    expect(result).toBeNull();
  });
});

describe("writeJson", () => {
  it("writes formatted JSON", async () => {
    mockWriteTextFile.mockResolvedValue(undefined);
    const data = { key: "value", num: 42 };
    await writeJson("settings.json", data);
    expect(mockWriteTextFile).toHaveBeenCalledWith(
      "settings.json",
      JSON.stringify(data, null, 2),
      expect.any(Object)
    );
  });
});

describe("ensureDataDir", () => {
  it("creates directory if it does not exist", async () => {
    mockExists.mockResolvedValue(false);
    mockMkdir.mockResolvedValue(undefined);
    await ensureDataDir();
    expect(mockMkdir).toHaveBeenCalledWith("/mock/app/data", { recursive: true });
  });

  it("does not create directory if it already exists", async () => {
    mockExists.mockResolvedValue(true);
    await ensureDataDir();
    expect(mockMkdir).not.toHaveBeenCalled();
  });
});
