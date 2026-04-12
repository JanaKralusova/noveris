import { useState, useEffect, useCallback } from "react";
import { Settings } from "@/lib/types";
import { readJson, writeJson } from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

const FILENAME = "settings.json";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJson<Settings>(FILENAME).then((data) => {
      if (data) {
        setSettings(data);
      } else {
        writeJson(FILENAME, DEFAULT_SETTINGS);
      }
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (updated: Settings) => {
    setSettings(updated);
    await writeJson(FILENAME, updated);
  }, []);

  return { settings, loading, updateSettings };
}
