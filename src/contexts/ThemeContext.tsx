import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';
console.log("ThemeContext初始化, 是否浏览器环境:", isBrowser);

export function ThemeProvider({ children }: { children: preact.ComponentChildren }) {
  console.log("ThemeProvider渲染");
  
  // 初始主题设置为system，实际值将在useEffect中更新
  const [theme, setTheme] = useState<ThemeType>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // 组件挂载后初始化主题
  useEffect(() => {
    console.log("ThemeProvider挂载");
    setMounted(true);
    try {
      // 从localStorage读取主题
      const savedTheme = localStorage.getItem("theme") as ThemeType;
      console.log("从localStorage读取的主题:", savedTheme);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.error("Failed to access localStorage:", e);
    }
  }, []);

  // 主题更改时的副作用
  useEffect(() => {
    if (!mounted) return;
    
    try {
      console.log(`主题更改为: ${theme}`); // 调试日志
      
      const root = window.document.documentElement;
      
      // 保存主题到本地存储
      localStorage.setItem("theme", theme);
      console.log("保存主题到localStorage:", theme);
      
      // 移除旧类名
      root.classList.remove("light", "dark");
      
      // 计算实际应用的主题
      let appliedTheme: "light" | "dark";
      
      if (theme === "system") {
        appliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        appliedTheme = theme as "light" | "dark";
      }
      
      // 添加新类名
      console.log("应用主题类:", appliedTheme);
      root.classList.add(appliedTheme);
      setResolvedTheme(appliedTheme);
    } catch (e) {
      console.error("应用主题时出错:", e);
    }
  }, [theme, mounted]);
  
  // 监听系统主题变化
  useEffect(() => {
    if (!mounted || theme !== "system") return;
    
    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      console.log("设置系统主题变化监听器");
      
      const handleChange = () => {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        console.log("系统主题变化:", newTheme);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        setResolvedTheme(newTheme);
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (e) {
      console.error("设置系统主题监听时出错:", e);
      return () => {};
    }
  }, [theme, mounted]);
  
  const changeTheme = (newTheme: ThemeType) => {
    console.log(`尝试设置主题为: ${newTheme}`); // 调试日志
    if (newTheme === theme) {
      console.log("主题相同，不做更改");
      return;
    }
    setTheme(newTheme);
  };
  
  const value = {
    theme,
    setTheme: changeTheme,
    resolvedTheme
  };
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
} 
