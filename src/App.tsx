import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { WritePage } from "./pages/WritePage";
import { ReadPage } from "./pages/ReadPage";
import { NostrEventPage } from "./pages/NostrEventPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ThemeProvider } from "./contexts/ThemeContext";

// 在App组件外初始化主题，确保早期加载
(function initTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");
    const root = document.documentElement;
    
    if (savedTheme === "dark") {
      root.classList.add("dark");
    } else if (savedTheme === "light") {
      root.classList.add("light");
    } else if (savedTheme === "system" || !savedTheme) {
      // 跟随系统主题
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  } catch (e) {
    console.error("初始化主题失败:", e);
  }
})();

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<WritePage />} />
          <Route path="/read" element={<ReadPage />} />
          <Route path="/nostr/:eventId" element={<NostrEventPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
