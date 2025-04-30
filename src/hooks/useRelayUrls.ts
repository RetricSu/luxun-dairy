import { useState, useEffect } from 'preact/hooks';
import { invoke } from "@tauri-apps/api/core";

interface Config {
  relay_urls: string[];
  default_relay_urls: string[];
}

export function useRelayUrls() {
  const [relayUrls, setRelayUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await invoke<Config>("get_config");
      setRelayUrls(config.relay_urls.length > 0 ? config.relay_urls : config.default_relay_urls);
      setError(null);
    } catch (err) {
      console.error("Failed to load relay URLs:", err);
      setError("Failed to load relay URLs configuration");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    relayUrls,
    isLoading,
    error,
    reload: loadConfig
  };
} 
