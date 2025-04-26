import { useState, useEffect } from "preact/hooks";
import { useNavigate } from "react-router-dom";
import * as diaryService from "../utils/diaryService";
import { shortenKey } from "../utils/helpers";
import { useTheme } from "../contexts/ThemeContext";
import { invoke } from "@tauri-apps/api/core";

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

  useEffect(() => {
    loadNostrPublicKey();
    getCacheStatus();
  }, []);

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
    <main className="max-w-4xl mx-auto py-8 px-6 sm:px-10 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <div className="flex justify-between items-center mb-10 pb-5 border-b border-[#e9e4d9] dark:border-[#2c2c32]">
        <h1 className="text-2xl font-medium text-[#42403a] dark:text-[#e6e1d5]">设置</h1>
        <button 
          className="bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white text-sm py-2.5 px-5 rounded-full hover:shadow-md"
          onClick={() => navigate(-1)}
        >
          返回
        </button>
      </div>
      
      <div className="mt-8 bg-white dark:bg-[#1e1e24] rounded-xl shadow-sm p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4 text-[#42403a] dark:text-[#e6e1d5]">日期设置</h2>
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-[#6d6a5c] dark:text-[#a2e2d8]">选择日期</label>
            <input 
              type="date" 
              value={selectedDay}
              onChange={handleDayChange}
              className="px-4 py-2 rounded-lg bg-[#f7f5f0] dark:bg-[#262630] text-[#5d5a4c] dark:text-[#a2e2d8] border border-[#e6e1d5] dark:border-[#323237]"
            />
            <button 
              className="mt-2 self-start bg-[#f0ede6] dark:bg-[#2a2a32] text-[#6d6a5c] dark:text-[#a2e2d8] px-4 py-2 rounded-lg border border-[#e6e1d5] dark:border-[#323237] hover:bg-[#e9e4d9] dark:hover:bg-[#323237]"
              onClick={() => navigate(`/?date=${selectedDay}`)}
            >
              跳转到此日期
            </button>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4 text-[#42403a] dark:text-[#e6e1d5]">Nostr 设置</h2>
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-[#6d6a5c] dark:text-[#a2e2d8]">公钥</label>
            <div className="px-4 py-3 rounded-lg bg-[#f7f5f0] dark:bg-[#262630] text-[#5d5a4c] dark:text-[#a2e2d8] border border-[#e6e1d5] dark:border-[#323237] font-mono text-sm break-all">
              {nostrPublicKey ? shortenKey(nostrPublicKey) : "未设置 Nostr 公钥"}
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4 text-[#42403a] dark:text-[#e6e1d5]">名人日记</h2>
          <p className="text-sm mb-4 text-[#6d6a5c] dark:text-[#a2e2d8]">
            您可以添加格式化的名人日记 JSON 文件至指定目录，系统会自动加载它们。
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={showCommonDiariesDir}
              className="bg-[#f0ede6] dark:bg-[#2a2a32] text-[#6d6a5c] dark:text-[#a2e2d8] px-4 py-2 rounded-lg border border-[#e6e1d5] dark:border-[#323237] hover:bg-[#e9e4d9] dark:hover:bg-[#323237]"
            >
              查看名人日记目录
            </button>
            
            <button
              onClick={refreshCommonDiariesCache}
              disabled={refreshing}
              className={`bg-[#f0ede6] dark:bg-[#2a2a32] text-[#6d6a5c] dark:text-[#a2e2d8] px-4 py-2 rounded-lg border border-[#e6e1d5] dark:border-[#323237] ${
                refreshing 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-[#e9e4d9] dark:hover:bg-[#323237]"
              }`}
            >
              {refreshing ? "刷新中..." : "重建缓存"}
            </button>
            
            <button
              onClick={downloadCommonDiaries}
              disabled={downloading}
              className={`bg-[#f0ede6] dark:bg-[#2a2a32] text-[#6d6a5c] dark:text-[#a2e2d8] px-4 py-2 rounded-lg border border-[#e6e1d5] dark:border-[#323237] ${
                downloading 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-[#e9e4d9] dark:hover:bg-[#323237]"
              }`}
            >
              {downloading ? "下载中..." : "下载名人日记"}
            </button>
          </div>
          
          <div className="mb-4 p-4 bg-[#f7f5f0] dark:bg-[#262630] rounded-lg border border-[#e6e1d5] dark:border-[#323237]">
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 mr-2 text-[#49b3a1] dark:text-[#43a595]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-sm font-medium text-[#6d6a5c] dark:text-[#a2e2d8]">
                缓存状态
                {loadingStatus && <span className="ml-2 text-xs italic opacity-70">更新中...</span>}
              </p>
            </div>
            <p className="text-sm py-2 px-3 bg-white dark:bg-[#1a1a1e] rounded border border-[#e6e1d5] dark:border-[#323237]">
              {loadingStatus ? "正在获取缓存状态..." : cacheStatus || "暂无缓存信息"}
            </p>
            <p className="text-xs mt-2 text-[#8c7c67] dark:text-[#8c8c84]">
              * 缓存可提高应用性能，减少文件加载时间。添加或修改日记文件后，请重建缓存。
            </p>
          </div>
          
          {dirPath && (
            <div className="mb-4 p-3 bg-[#f7f5f0] dark:bg-[#262630] rounded-lg border border-[#e6e1d5] dark:border-[#323237]">
              <p className="text-sm text-[#6d6a5c] dark:text-[#a2e2d8] mb-1">名人日记目录路径:</p>
              <code className="block text-xs p-2 bg-white dark:bg-[#1a1a1e] rounded border border-[#e6e1d5] dark:border-[#323237] overflow-x-auto">
                {dirPath}
              </code>
              <p className="text-xs mt-2 text-[#6d6a5c] dark:text-[#8c8c84]">
                请将您的JSON文件放在此目录中，应用将自动加载它们。
                添加或更新文件后请点击"刷新缓存"按钮使其生效。
              </p>
              <button
                onClick={() => setDirPath(null)}
                className="mt-2 text-xs text-[#49b3a1] dark:text-[#43a595] hover:underline"
              >
                隐藏路径
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4 text-[#42403a] dark:text-[#e6e1d5]">主题设置</h2>
          <p className="text-[#6d6a5c] dark:text-[#a2e2d8] mb-4">当前主题: {theme}</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => handleThemeChange("light")}
              className={`px-4 py-2 rounded-lg bg-white text-[#5d5a4c] border ${theme === 'light' ? 'border-[#49b3a1] ring-2 ring-[#49b3a1]/20' : 'border-[#e6e1d5]'} hover:bg-[#f7f5f0]`}
            >
              明亮
            </button>
            <button 
              onClick={() => handleThemeChange("dark")}
              className={`px-4 py-2 rounded-lg bg-[#262630] text-[#e6e1d5] border ${theme === 'dark' ? 'border-[#49b3a1] ring-2 ring-[#49b3a1]/20' : 'border-[#323237]'} hover:bg-[#2a2a32]`}
            >
              暗黑
            </button>
            <button 
              onClick={() => handleThemeChange("system")}
              className={`px-4 py-2 rounded-lg bg-[#f7f5f0] text-[#5d5a4c] border ${theme === 'system' ? 'border-[#49b3a1] ring-2 ring-[#49b3a1]/20' : 'border-[#e6e1d5]'} hover:bg-[#f0ede6]`}
            >
              系统
            </button>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-medium mb-4 text-[#42403a] dark:text-[#e6e1d5]">关于</h2>
          <p className="text-[#6d6a5c] dark:text-[#a2e2d8] mb-2">鲁迅日记 v0.1.0</p>
          <p className="text-[#6d6a5c] dark:text-[#a2e2d8] text-sm">一个基于 Tauri 的桌面日记应用</p>
        </div>
      </div>
    </main>
  );
} 
