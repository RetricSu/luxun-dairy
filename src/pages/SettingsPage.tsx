import { useState, useEffect } from "preact/hooks";
import { useNavigate } from "react-router-dom";
import * as diaryService from "../utils/diaryService";
import { useTheme } from "../contexts/ThemeContext";
import { invoke } from "@tauri-apps/api/core";

interface Config {
  relay_urls: string[];
  default_relay_urls: string[];
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [nostrPublicKey, setNostrPublicKey] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );
  const [dirPath, setDirPath] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [config, setConfig] = useState<Config>({
    relay_urls: [],
    default_relay_urls: [],
  });
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadNostrPublicKey();
    getCacheStatus();
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const config = await invoke<Config>("get_config");
      setConfig(config);
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  }

  async function addRelayUrl() {
    if (!newRelayUrl) return;
    
    if (!newRelayUrl.startsWith("wss://") && !newRelayUrl.startsWith("ws://")) {
      setError("中继服务器地址必须以 wss:// 或 ws:// 开头");
      return;
    }

    if (config.relay_urls.includes(newRelayUrl)) {
      setError("该中继服务器地址已存在");
      return;
    }

    const newConfig = {
      ...config,
      relay_urls: [...config.relay_urls, newRelayUrl],
    };

    try {
      setConfig(newConfig);
      await invoke("update_config", { newConfig });
      setNewRelayUrl("");
      setError("");
    } catch (error) {
      setError("保存配置失败");
      console.error("Failed to save config:", error);
      // 恢复原来的配置
      setConfig(config);
    }
  }

  async function removeRelayUrl(url: string) {
    const newConfig = {
      ...config,
      relay_urls: config.relay_urls.filter((u) => u !== url),
    };

    try {
      setConfig(newConfig);
      await invoke("update_config", { newConfig });
    } catch (error) {
      setError("删除中继服务器失败");
      console.error("Failed to remove relay URL:", error);
      // 恢复原来的配置
      setConfig(config);
    }
  }

  async function loadNostrPublicKey() {
    try {
      const publicKey = await diaryService.loadNostrPublicKey();
      setNostrPublicKey(publicKey);
    } catch (error) {
      console.error("Failed to load Nostr public key:", error);
    }
  }

  async function getCacheStatus() {
    setLoadingStatus(true);
    try {
      const status = await diaryService.getCommonDiariesCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error("Failed to get cache status:", error);
      setCacheStatus("获取缓存状态失败");
    } finally {
      setLoadingStatus(false);
    }
  }

  function handleDayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setSelectedDay(target.value);
  }

  const showCommonDiariesDir = async () => {
    try {
      const path = await invoke<string>("get_common_diaries_dir_path");
      setDirPath(path);
    } catch (error) {
      console.error("Failed to get common diaries directory:", error);
    }
  };

  const refreshCommonDiariesCache = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await diaryService.refreshCommonDiariesCache();
      // After refreshing, update the cache status
      await getCacheStatus();
      alert("公共日记缓存已重建，可以访问'阅读'页面查看更新");
    } catch (error) {
      console.error("Failed to refresh common diaries cache:", error);
      alert("刷新缓存失败");
    } finally {
      setRefreshing(false);
    }
  };

  const downloadCommonDiaries = async () => {
    if (downloading) return;
    
    setDownloading(true);
    try {
      await invoke("download_common_diaries", {});
      // After downloading, update the cache status
      await getCacheStatus();
      alert("名人日记下载成功，可以访问'阅读'页面查看");
    } catch (error) {
      console.error("Failed to download common diaries:", error);
      alert("下载名人日记失败");
    } finally {
      setDownloading(false);
    }
  };

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    console.log("切换主题为:", newTheme);
    
    setTheme(newTheme);
    
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    let appliedTheme: "light" | "dark";
    if (newTheme === "system") {
      appliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      appliedTheme = newTheme as "light" | "dark";
    }
    
    root.classList.add(appliedTheme);
    localStorage.setItem("theme", newTheme);
  }

  return (
    <main className="max-w-3xl mx-auto py-6 px-4 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#e9e4d9] dark:border-[#2c2c32]">
        <h1 className="text-xl font-medium text-[#42403a] dark:text-[#e6e1d5]">设置</h1>
        <button 
          className="bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white text-sm py-2.5 px-5 rounded-full hover:shadow-md"
          onClick={() => navigate(-1)}
        >
          返回
        </button>
      </div>
      
      <div className="space-y-6">
        {/* 日期设置 */}
        <section className="bg-white dark:bg-[#1e1e24] rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3 text-[#42403a] dark:text-[#e6e1d5]">日期设置</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                type="date" 
                value={selectedDay}
                onChange={handleDayChange}
                className="flex-1 px-3 py-1.5 rounded bg-[#f7f5f0] dark:bg-[#262630] text-[#5d5a4c] dark:text-[#a2e2d8] border border-[#e6e1d5] dark:border-[#323237] focus:outline-none focus:border-[#49b3a1] dark:focus:border-[#43a595]"
              />
              <button 
                className="text-[#49b3a1] dark:text-[#43a595] hover:text-[#3a9e8d] dark:hover:text-[#389384] text-sm px-3 py-1.5"
                onClick={() => navigate(`/?date=${selectedDay}`)}
              >
                跳转
              </button>
            </div>
          </div>
        </section>

        {/* Nostr 设置 */}
        <section className="bg-white dark:bg-[#1e1e24] rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3 text-[#42403a] dark:text-[#e6e1d5]">Nostr 设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8c7c67] dark:text-[#a6a69e] mb-2">
                Nostr 公钥
              </label>
              <div className="px-3 py-2 rounded bg-[#f7f5f0] dark:bg-[#262630] text-[#5d5a4c] dark:text-[#a2e2d8] border border-[#e6e1d5] dark:border-[#323237] font-mono text-sm break-all">
                {nostrPublicKey ?? "未设置 Nostr 公钥"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8c7c67] dark:text-[#a6a69e] mb-2">
                中继服务器设置
              </label>
              {error && (
                <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newRelayUrl}
                  onChange={(e) => setNewRelayUrl((e.target as HTMLInputElement).value)}
                  placeholder="wss://relay.example.com"
                  className="flex-1 rounded-l-md border border-[#e9e4d9] dark:border-[#2c2c32] px-3 py-2 bg-white dark:bg-[#1a1a1e] text-[#8c7c67] dark:text-[#a6a69e] focus:outline-none focus:ring-2 focus:ring-[#49b3a1] dark:focus:ring-[#43a595]"
                />
                <button
                  onClick={addRelayUrl}
                  className="bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white px-4 py-2 rounded-r-md hover:shadow-md"
                >
                  添加
                </button>
              </div>
              <div className="space-y-2">
                {config.relay_urls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center justify-between p-2 bg-[#f9f6f0] dark:bg-[#2a2a28] rounded"
                  >
                    <span className="text-sm text-[#8c7c67] dark:text-[#a6a69e]">
                      {url}
                    </span>
                    <button
                      onClick={() => removeRelayUrl(url)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 名人日记 */}
        <section className="bg-white dark:bg-[#1e1e24] rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3 text-[#42403a] dark:text-[#e6e1d5]">名人日记</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={showCommonDiariesDir}
                className="text-sm text-[#49b3a1] dark:text-[#43a595] hover:text-[#3a9e8d] dark:hover:text-[#389384] px-3 py-1.5"
              >
                查看目录
              </button>
              <button
                onClick={refreshCommonDiariesCache}
                disabled={refreshing}
                className={`text-sm text-[#49b3a1] dark:text-[#43a595] hover:text-[#3a9e8d] dark:hover:text-[#389384] px-3 py-1.5 ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {refreshing ? "刷新中..." : "重建缓存"}
              </button>
              <button
                onClick={downloadCommonDiaries}
                disabled={downloading}
                className={`text-sm text-[#49b3a1] dark:text-[#43a595] hover:text-[#3a9e8d] dark:hover:text-[#389384] px-3 py-1.5 ${
                  downloading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {downloading ? "下载中..." : "下载名人日记"}
              </button>
            </div>
            {loadingStatus ? (
              <div className="text-sm text-[#8c7c67] dark:text-[#a6a69e]">加载中...</div>
            ) : (
              <div className="text-sm text-[#8c7c67] dark:text-[#a6a69e]">{cacheStatus}</div>
            )}
            {dirPath && (
              <div className="text-sm text-[#8c7c67] dark:text-[#a6a69e] break-all">
                名人日记目录: {dirPath}
              </div>
            )}
          </div>
        </section>

        {/* 主题设置 */}
        <section className="bg-white dark:bg-[#1e1e24] rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3 text-[#42403a] dark:text-[#e6e1d5]">主题设置</h2>
          <div className="flex gap-3">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t as "light" | "dark" | "system")}
                className={`px-3 py-1.5 rounded text-sm ${
                  theme === t
                    ? 'bg-[#49b3a1] dark:bg-[#43a595] text-white'
                    : 'text-[#5d5a4c] dark:text-[#a2e2d8] hover:bg-[#f7f5f0] dark:hover:bg-[#262630]'
                }`}
              >
                {{light: '明亮', dark: '暗黑', system: '系统'}[t]}
              </button>
            ))}
          </div>
        </section>

        {/* 关于 */}
        <section className="bg-white dark:bg-[#1e1e24] rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3 text-[#42403a] dark:text-[#e6e1d5]">关于</h2>
          <div className="space-y-1 text-sm text-[#5d5a4c] dark:text-[#a2e2d8]">
            <p>鲁迅日记 v0.1.0</p>
            <p className="text-xs">一个基于 Tauri 的桌面日记应用</p>
          </div>
        </section>
      </div>
    </main>
  );
} 
