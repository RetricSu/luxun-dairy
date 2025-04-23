import { useState, useEffect } from "preact/hooks";
import { useNavigate } from "react-router-dom";
import * as diaryService from "../utils/diaryService";
import { shortenKey } from "../utils/helpers";
import { useTheme } from "../contexts/ThemeContext";

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [nostrPublicKey, setNostrPublicKey] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );

  useEffect(() => {
    loadNostrPublicKey();
  }, []);

  async function loadNostrPublicKey() {
    try {
      const publicKey = await diaryService.loadNostrPublicKey();
      setNostrPublicKey(publicKey);
    } catch (error) {
      console.error("Failed to load Nostr public key:", error);
    }
  }

  function handleDayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setSelectedDay(target.value);
  }

  // 主题切换处理函数
  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    console.log("切换主题为:", newTheme);
    
    // 使用Context API切换主题
    setTheme(newTheme);
    
    // 同时也直接更新DOM，以防Context API不工作
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
