import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import { 
  Book, 
  Feather, 
  FileText, 
  User as UserIcon, 
  Layers, 
  HelpCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  RotateCcw, 
  TrendingUp, 
  Save, 
  Compass, 
  FileSpreadsheet, 
  Palette, 
  Sparkles,
  RefreshCw,
  BookOpen,
  Eye,
  Settings,
  X,
  FileDown,
  Search,
  Bell,
  Users,
  Link2,
  Clock,
  Calendar,
  Activity,
  Award,
  BookOpenCheck,
  MessageSquare,
  ImagePlus,
  History as HistoryIcon,
  Home,
  Crown,
  ChevronRight,
  Menu,
  Share2,
  CloudLightning
} from "lucide-react";
import { 
  Novel, 
  Plot, 
  Character, 
  Episode, 
  SettingWorld, 
  MemoIdea,
  User
} from "./types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Core Novel Navigation
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  // Active workspace tab (Nora features setup)
  // "theme" (テーマ), "plots" (プロット・時系列), "relations" (登場人物・相関図), "write" (執筆・エディタ), "settings" (資料・世界観), "memos" (メモ・セリフ)
  const [activeTab, setActiveTab] = useState<"theme" | "plots" | "relations" | "write" | "settings" | "memos">("plots");

  // Novel Data collections
  const [plots, setPlots] = useState<Plot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [worldSettings, setWorldSettings] = useState<SettingWorld[]>([]);
  const [memos, setMemos] = useState<MemoIdea[]>([]);

  // Editing Sub-states
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [isVerticalWriting, setIsVerticalWriting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "offline">("synced");

  // --- Modals Form States ---
  const [showNovelModal, setShowNovelModal] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [newNovelTitle, setNewNovelTitle] = useState("");
  const [newNovelDesc, setNewNovelDesc] = useState("");
  const [newNovelCover, setNewNovelCover] = useState("");
  const [newNovelTheme, setNewNovelTheme] = useState("");
  const [newNovelAudience, setNewNovelAudience] = useState("");
  const [newNovelEnding, setNewNovelEnding] = useState("");
  const [newNovelWordGoal, setNewNovelWordGoal] = useState("50000");
  const [newNovelWriteDays, setNewNovelWriteDays] = useState("30");

  // Plots Modals / Form
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [newPlotTitle, setNewPlotTitle] = useState("");
  const [newPlotContent, setNewPlotContent] = useState("");
  const [newPlotPhase, setNewPlotPhase] = useState<"起" | "承" | "転" | "結" | "設定">("起");
  const [newPlotTimeline, setNewPlotTimeline] = useState("");

  // Characters Modals / Form
  const [showCharModal, setShowCharModal] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState("");
  const [newCharAge, setNewCharAge] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharAppearance, setNewCharAppearance] = useState("");
  const [newCharPersonality, setNewCharPersonality] = useState("");
  const [newCharRelation, setNewCharRelation] = useState("");
  const [newCharImageUrl, setNewCharImageUrl] = useState("");

  // World Settings (資料) Modals / Form
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [editingWorld, setEditingWorld] = useState<SettingWorld | null>(null);
  const [newWorldTitle, setNewWorldTitle] = useState("");
  const [newWorldCategory, setNewWorldCategory] = useState<"世界観" | "用語" | "年表" | "その他">("世界観");
  const [newWorldDetail, setNewWorldDetail] = useState("");
  const [newWorldIsFusen, setNewWorldIsFusen] = useState(false);
  const [newWorldFusenStatus, setNewWorldFusenStatus] = useState<"未回収" | "回収済">("未回収");

  // Memos Modals / Form
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState<MemoIdea | null>(null);
  const [newMemoTitle, setNewMemoTitle] = useState("");
  const [newMemoContent, setNewMemoContent] = useState("");
  const [newMemoColor, setNewMemoColor] = useState("#fffbeb"); // amber-50 default

  // --- Extended AI Studio / Manus Restored Features State ---
  // Character Custom Fields Edit state
  const [newCharCustomFields, setNewCharCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [customFieldKey, setCustomFieldKey] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");

  // --- Beautiful Writing Palette Themes and Premium states ---
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      return localStorage.getItem("plot_palette_premium_v1") === "true";
    } catch {
      return false;
    }
  });
  const [themeState, setThemeState] = useState<"light" | "dark" | "sakura" | "parchment" | "night" | "manuscript" | "custom">((() => {
    try {
      return (localStorage.getItem("plot_palette_theme_v1") as any) || "light";
    } catch {
      return "light";
    }
  }));
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"none" | "novel_long" | "novel_short" | "free">("none");
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  // Free Color Palette Customization States (1600万色)
  const [customBg, setCustomBg] = useState(() => localStorage.getItem("palette_custom_bg") || "#fff5f6");
  const [customCard, setCustomCard] = useState(() => localStorage.getItem("palette_custom_card") || "#ffffff");
  const [customText, setCustomText] = useState(() => localStorage.getItem("palette_custom_text") || "#4c0519");
  const [customBorder, setCustomBorder] = useState(() => localStorage.getItem("palette_custom_border") || "#fecdd3");
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem("palette_custom_accent") || "#db2777");

  // BOOTH Premium Password Input State
  const [codeInput, setCodeInput] = useState("");

  // Full Text Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Help & Guide Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Social & Work Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  // Mobile Hamburger Toggle
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Cloud Sync & DB Debug Modals
  const [showDbStatusModal, setShowDbStatusModal] = useState(false);
  const [dbStatusData, setDbStatusData] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  const checkDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch("/api/debug/db-status");
      if (res.ok) {
        const data = await res.json();
        setDbStatusData(data);
      } else {
        setDbStatusData({ error: `HTTP ${res.status}: エラーが発生しました。` });
      }
    } catch (err: any) {
      setDbStatusData({ error: err.message || "ネットワーク接続失敗" });
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Print / PDF States
  const [isPrintingMode, setIsPrintingMode] = useState(false);
  const [printingEpisode, setPrintingEpisode] = useState<Episode | null>(null);

  // Reference Link Edit State
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Version Control (Snapshots)
  const [episodeSnapshots, setEpisodeSnapshots] = useState<{
    id: string;
    episodeId: string;
    timestamp: string;
    body: string;
    note: string;
    wordCount: number;
  }[]>(() => {
    try {
      const sn = localStorage.getItem("plot_palette_snapshots_v1");
      return sn ? JSON.parse(sn) : [];
    } catch {
      return [];
    }
  });
  const [saveSnapshotNote, setSaveSnapshotNote] = useState("");

  // Comments System
  const [episodeComments, setEpisodeComments] = useState<{
    id: string;
    episodeId: string;
    author: string;
    text: string;
    createdAt: string;
  }[]>(() => {
    try {
      const co = localStorage.getItem("plot_palette_comments_v1");
      return co ? JSON.parse(co) : [];
    } catch {
      return [];
    }
  });
  const [newCommentText, setNewCommentText] = useState("");

  // Notification Dashboard
  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    content: string;
    date: string;
    type: "info" | "warning" | "success";
    read: boolean;
  }[]>(() => {
    try {
      const no = localStorage.getItem("plot_palette_notifications_v1");
      return no ? JSON.parse(no) : [
        {
          id: "notif-welcome",
          title: "パレット準備完了",
          content: "ようこそ！新しいパレットで素晴らしい物語を紡いでください。",
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "success",
          read: false
        }
      ];
    } catch {
      return [];
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Clipboard copy state flags
  const [copiedEpisodeId, setCopiedEpisodeId] = useState<string | null>(null);

  // Episodes Modals / Form
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeStatus, setNewEpisodeStatus] = useState<"下書き" | "完成" | "推敲中">("下書き");
  const [newEpisodeTag, setNewEpisodeTag] = useState<"プロローグ" | "本編" | "エピローグ" | "その他">("本編");

  // Check login session
  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Unauthorized");
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  // --- Hybrid Backup Synchronization System (Master Sync Engine) ---
  // If servers spin down, restart, or DB defaults, we seamlessly load from locale & push updates back!
  const loadBackupData = () => {
    try {
      const backup = localStorage.getItem("plot_palette_backup_v2");
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed.novels && parsed.novels.length > 0) {
          console.log("[Backup Engine] Restoring local storage contents due to empty server states.");
          setNovels(parsed.novels);
          return parsed;
        }
      }
    } catch (e) {
      console.error("Backup load failed", e);
    }
    return null;
  };

  const writeBackupData = (overrideData?: any) => {
    try {
      const dataToBackup = overrideData || {
        novels,
        plots,
        characters,
        episodes,
        worldSettings,
        memos
      };
      localStorage.setItem("plot_palette_backup_v2", JSON.stringify(dataToBackup));
    } catch (e) {
      console.error("Backup save failed", e);
    }
  };

  // Fetch novels on user session resolution & Auto Sync Offline Data
  useEffect(() => {
    if (user) {
      setSyncStatus("saving");
      fetch("/api/novels")
        .then((res) => {
          if (!res.ok) throw new Error("Server error " + res.status);
          return res.json();
        })
        .then(async (dbNovels: any[]) => {
          const backupStr = localStorage.getItem("plot_palette_backup_v2");
          let localBackup: any = null;
          if (backupStr) {
            try {
              localBackup = JSON.parse(backupStr);
            } catch (e) {
              console.error("Backup syntax err", e);
            }
          }

          if (localBackup && localBackup.novels && localBackup.novels.length > 0) {
            const syncedNovels = [...dbNovels];
            let hasNewMerge = false;

            for (const localN of localBackup.novels) {
              const alreadyInCloud = dbNovels.some((dn) => dn.id === localN.id || dn.title === localN.title);
              if (!alreadyInCloud) {
                hasNewMerge = true;
                console.log(`[Master Sync] Auto migrating local novel to cloud: "${localN.title}"`);
                try {
                  const nRes = await fetch("/api/novels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: localN.title,
                      description: localN.description,
                      coverImage: localN.coverImage,
                      themeDoc: localN.themeDoc,
                      targetAudience: localN.targetAudience,
                      endingDoc: localN.endingDoc,
                      wordGoal: localN.wordGoal,
                      writeDays: localN.writeDays,
                      chartImage: localN.chartImage,
                      chartMemo: localN.chartMemo,
                    })
                  });

                  if (nRes.ok) {
                    const savedCloudN = await nRes.json();
                    const newCloudId = savedCloudN.id;
                    const oldLocalId = localN.id;

                    syncedNovels.push(savedCloudN);

                    // Sync sub-collections
                    // 1. Plots
                    const localPlots = (localBackup.plots || []).filter((p: any) => p.novelId === oldLocalId);
                    for (const lp of localPlots) {
                      await fetch(`/api/novels/${newCloudId}/plots`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: lp.title,
                          content: lp.content,
                          phase: lp.phase,
                          timelineDate: lp.timelineDate,
                        })
                      }).catch(e => console.error("Plot migrate err", e));
                    }

                    // 2. Characters
                    const localChars = (localBackup.characters || []).filter((c: any) => c.novelId === oldLocalId);
                    for (const lc of localChars) {
                      await fetch(`/api/novels/${newCloudId}/characters`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: lc.name,
                          role: lc.role,
                          description: lc.description,
                          age: lc.age,
                          appearance: lc.appearance,
                          personality: lc.personality,
                          relationInfo: lc.relationInfo,
                          imageUrl: lc.imageUrl,
                          customFields: lc.customFields,
                        })
                      }).catch(e => console.error("Char migrate err", e));
                    }

                    // 3. Settings
                    const localSettings = (localBackup.worldSettings || []).filter((s: any) => s.novelId === oldLocalId);
                    for (const ls of localSettings) {
                      await fetch(`/api/novels/${newCloudId}/settings`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: ls.title,
                          category: ls.category,
                          detail: ls.detail,
                          isFusen: ls.isFusen,
                          fusenStatus: ls.fusenStatus,
                        })
                      }).catch(e => console.error("Setting migrate err", e));
                    }

                    // 4. Memos
                    const localMemos = (localBackup.memos || []).filter((m: any) => m.novelId === oldLocalId);
                    for (const lm of localMemos) {
                      await fetch(`/api/novels/${newCloudId}/memos`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: lm.title,
                          content: lm.content,
                          color: lm.color,
                        })
                      }).catch(e => console.error("Memo migrate err", e));
                    }

                    // 5. Episodes
                    const localEpisodes = (localBackup.episodes || []).filter((ep: any) => ep.novelId === oldLocalId);
                    for (const lep of localEpisodes) {
                      await fetch(`/api/novels/${newCloudId}/episodes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: lep.title,
                          body: lep.body,
                          status: lep.status,
                          tag: lep.tag,
                          wordCount: lep.wordCount,
                        })
                      }).catch(e => console.error("Episode migrate err", e));
                    }

                    console.log(`[Master Sync] Successfully processed and uploaded "${localN.title}"!`);
                  }
                } catch (e) {
                  console.error("Migration fatal err ", e);
                }
              }
            }

            if (hasNewMerge) {
              setNovels(syncedNovels);
              // 即時にローカルバックアップのnovelsをクラウド同期後の正しいデータに置き換え、再マージや古いIDでの重複を防ぐ
              const updatedBackup = {
                novels: syncedNovels,
                plots: localBackup.plots || [],
                characters: localBackup.characters || [],
                episodes: localBackup.episodes || [],
                worldSettings: localBackup.worldSettings || [],
                memos: localBackup.memos || []
              };
              localStorage.setItem("plot_palette_backup_v2", JSON.stringify(updatedBackup));
              toast.success("オフラインで作成された未同期プロジェクトが自動移行・マージされました 📡✨");
            } else {
              setNovels(dbNovels);
            }
          } else {
            setNovels(dbNovels);
          }
          setSyncStatus("synced");
        })
        .catch((err) => {
          console.error("Failed to load novels, loading offline backup", err);
          loadBackupData();
          setSyncStatus("offline");
          toast.error("サーバーとの通信に失敗しました。オフラインモードで安全に起動しました 🔒");
        });
    }
  }, [user]);

  // Handle auto backup on current states modification
  useEffect(() => {
    if (user && selectedNovel) {
      writeBackupData();
    }
  }, [novels, plots, characters, episodes, worldSettings, memos, selectedNovel]);

  // Fetch sub collections when selected novel changes
  useEffect(() => {
    if (selectedNovel) {
      setSyncStatus("saving");
      Promise.all([
        fetch(`/api/novels/${selectedNovel.id}/plots`).then((r) => r.json()),
        fetch(`/api/novels/${selectedNovel.id}/characters`).then((r) => r.json()),
        fetch(`/api/novels/${selectedNovel.id}/episodes`).then((r) => r.json()),
        fetch(`/api/novels/${selectedNovel.id}/settings`).then((r) => r.json()),
        fetch(`/api/novels/${selectedNovel.id}/memos`).then((r) => r.json())
      ])
        .then(([p, c, e, s, m]) => {
          setPlots(p);
          setCharacters(c);
          setEpisodes(e);
          setWorldSettings(s);
          setMemos(m);

          // Auto select first episode for editor if exists
          if (e && e.length > 0) {
            setActiveEpisode(e[0]);
          } else {
            setActiveEpisode(null);
          }
          setSyncStatus("synced");
        })
        .catch((error) => {
          console.error("Network fetching error, checking fallback restore", error);
          const backup = loadBackupData();
          if (backup) {
            setPlots(backup.plots?.filter((x: any) => x.novelId === selectedNovel.id) || []);
            setCharacters(backup.characters?.filter((x: any) => x.novelId === selectedNovel.id) || []);
            setEpisodes(backup.episodes?.filter((x: any) => x.novelId === selectedNovel.id) || []);
            setWorldSettings(backup.worldSettings?.filter((x: any) => x.novelId === selectedNovel.id) || []);
            setMemos(backup.memos?.filter((x: any) => x.novelId === selectedNovel.id) || []);
          }
          setSyncStatus("offline");
        });
    }
  }, [selectedNovel]);

  // Auth logout
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setSelectedNovel(null);
  };

  const handlePrintEpisode = (episode: Episode) => {
    setPrintingEpisode(episode);
    setIsPrintingMode(true);
    toast.info("PDFを生成しています。数秒お待ちください...");
    setTimeout(async () => {
      const element = document.getElementById("print-canvas-area");
      if (!element) {
        setIsPrintingMode(false);
        setPrintingEpisode(null);
        return;
      }
      try {
        // html2canvas oklch workaround: Tailwind V4 outputs oklch which html2canvas 1.4.1 doesn't support.
        // We temporarily wrap getComputedStyle to filter out oklch values to prevent crashes.
        const originalGetComputedStyle = window.getComputedStyle;
        window.getComputedStyle = function(el, pseudo) {
          const style = originalGetComputedStyle(el, pseudo);
          return new Proxy(style, {
            get: function(target, prop) {
              const val = (target as any)[prop];
              if (typeof val === 'function') {
                return val.bind(target);
              }
              if (typeof val === 'string' && val.includes('oklch')) {
                if (String(prop).toLowerCase().includes('color')) {
                    if (String(prop) === 'backgroundColor' || String(prop) === 'background') return 'rgb(255, 255, 255)';
                    return 'rgb(0, 0, 0)';
                }
                return val.replace(/oklch\([^)]+\)/g, 'rgb(0, 0, 0)');
              }
              return val;
            }
          }) as CSSStyleDeclaration;
        };

        const canvas = await html2canvas(element, { scale: 2 });
        
        // Restore immediately after capture
        window.getComputedStyle = originalGetComputedStyle;

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });
        
        // A4サイズに合わせて縮尺を調整 (幅を合わせる)
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

        const triggerDownload = (b: Blob, filename: string) => {
          const blobUrl = URL.createObjectURL(b);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          toast.success("PDFをダウンロードしました！");
        };

        // スマホなどで確実にダウンロード・共有させるためのBlob処理
        const blob = pdf.output("blob");
        const file = new File([blob], `${episode.title || "episode"}.pdf`, { type: "application/pdf" });
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          try {
            const pdfDataUri = pdf.output("datauristring");
            const newWindow = window.open();
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head>
                    <title>${episode.title || "PDF プレビュー"}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background-color:#333; }
                      iframe { border:none; width:100%; height:100%; }
                    </style>
                  </head>
                  <body>
                    <iframe src="${pdfDataUri}"></iframe>
                  </body>
                </html>
              `);
              newWindow.document.close();
              toast.success("PDFを表示しました。右上の共有/保存メニューをご利用ください 📂✨");
            } else {
              triggerDownload(blob, `${episode.title || "episode"}.pdf`);
            }
          } catch (e) {
            triggerDownload(blob, `${episode.title || "episode"}.pdf`);
          }
        } else if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: episode.title || "無題の執筆",
            });
            toast.success("PDFの共有・保存が完了しました！");
          } catch (shareErr) {
            triggerDownload(blob, `${episode.title || "episode"}.pdf`);
          }
        } else {
          triggerDownload(blob, `${episode.title || "episode"}.pdf`);
        }

      } catch (err) {
        console.error(err);
        toast.error("PDFの生成に失敗しました");
      } finally {
        setIsPrintingMode(false);
        setPrintingEpisode(null);
      }
    }, 1000); // Wait for DOM to fully render
  };

  // --- Theme change and premium features ---
  const handleSelectTheme = (theme: "light" | "dark" | "sakura" | "parchment" | "night" | "manuscript" | "custom") => {
    if (theme !== "light" && theme !== "dark" && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setThemeState(theme);
    localStorage.setItem("plot_palette_theme_v1", theme);
    
    // 通知を追加
    const newNotif = {
      id: `notif-theme-${Date.now()}`,
      title: "テーマを適用しました",
      content: `アトリエの配色を、新しいパレットに染め直しました。`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "success" as const,
      read: false
    };
    setNotifications([newNotif, ...notifications].slice(0, 50));
  };

  const handleTogglePremium = (enable: boolean) => {
    setIsPremium(enable);
    localStorage.setItem("plot_palette_premium_v1", enable ? "true" : "false");
    
    // 通知を追加
    const newNotif = {
      id: `notif-premium-${Date.now()}`,
      title: enable ? "👑 プレミアムプラン適用中" : "フリープランに変更しました",
      content: enable 
        ? "もふみつ工房のすべての快適機能（限定桜パレット、無制限プロジェクト、執筆統計、画像添付、すかし無しPDF出力）が解放されました！"
        : "フリープランになりました。快適化パレットはいつでも再アンロックできます！",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "success" as const,
      read: false
    };
    setNotifications([newNotif, ...notifications].slice(0, 50));
  };

  // テンプレートからデータを自動挿入するヘルパー
  const createTemplateData = async (novelId: string, templateType: "none" | "novel_long" | "novel_short" | "free") => {
    if (templateType === "none") return;
    
    setSyncStatus("saving");
    try {
      if (templateType === "free") {
        const payload = {
          title: "💡 フリーアトリエへようこそ",
          content: "制約は一切ありません。パレットを自由に選んで、あなたの脳内の美しい物語をのびのびと形にしましょう！",
          color: "#faf5ff" // purple
        };
        const res = await fetch(`/api/novels/${novelId}/memos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setMemos((prevMemos) => [...prevMemos, created]);
        }
      } else if (templateType === "novel_long") {
        // 長編（起承転結）
        const plotsToCreate = [
          { title: "起：日常と事件の発生", content: "【起（導入）】\n主人公の暮らす日常と、それを一変させる不思議な事件の発生。\n\n◆ 執筆のヒント疑問:\nQ. 主人公はこの段階でどんな退屈や不満、あるいは平穏を感じている？\nQ. 次の展開へ進むための、逃れられない『きっかけ』は何ですか？", phase: "起", timelineDate: "プロローグ〜序盤" },
          { title: "承：展開と葛藤", content: "【承（展開）】\n旅立ち、あるいは新たな課題との遭遇。葛藤や新たな仲間との絆。\n\n◆ 執筆 of ヒント疑問:\nQ. 主人公の前に立ちはだかる最初の障害は何ですか？\nQ. 周囲のキャラクターは主人公をどうサポート、あるいは邪魔しますか？", phase: "承", timelineDate: "中盤（展開部）" },
          { title: "転：最大の危機・破局", content: "【転（クライマックス）】\nこれまでの常識がひっくり返る事実の判明、あるいはラスボス出現による絶対絶命のピンチ。\n\n◆ 執筆 of ヒント疑問:\nQ. 絶望の淵で、主人公はどんな大切なものに気づきますか？\nQ. クライマックスで回収する最大の伏線はどう活かしますか？", phase: "転", timelineDate: "終盤（佳境）" },
          { title: "結：解決・大団円と未来", content: "【結（解決・エピローグ）】\n最後の力を振り絞っての逆転、あるいは問題の解決と未来。成長した主人公の姿。\n\n◆ 執筆 of ヒント疑問:\nQ. 事件を乗り越えた主人公は、最初の日常と比べて何が成長しましたか？", phase: "結", timelineDate: "エピローグ" }
        ];
        
        const initialMemo = {
          title: "🌸 長編執筆へのアドバイス",
          content: "初めから完璧な文章を書こうとせず、まずは各章の『起承転結』のプロットを骨組みとして完成させましょう。登場人物にMBTIを設定すると、セリフや行動のブレが劇的に減りますよ！",
          color: "#fdf2f8"
        };
        
        const initialFusen = {
          title: "🔑 最初の伏線を張ってみよう",
          category: "世界観",
          detail: "後々のクライマックスで『実はアレがこうだった』と驚かせるための小さな手がかりを登録しておきましょう。右上の『伏線チェッカー』をONにすると未解決・回収済を効率よく管理できます。",
          isFusen: true,
          fusenStatus: "未回収"
        };

        for (const p of plotsToCreate) {
          await fetch(`/api/novels/${novelId}/plots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p)
          });
        }
        await fetch(`/api/novels/${novelId}/memos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialMemo)
        });
        await fetch(`/api/novels/${novelId}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialFusen)
        });

      } else if (templateType === "novel_short") {
        // 短編
        const plotsToCreate = [
          { title: "はじまり：日常と小さな変化", content: "【導入（変化の予兆）】\n短い描写で読者を惹きつける状況説明。\n\n◆ 執筆 of ヒント疑問:\nQ. 本作の『ワンアイデア・奇妙なシチュエーション』は何ですか？\nQ. 主人公に訪れる、最初の異常事態をスピーディに描写しましょう。", phase: "起", timelineDate: "前半パート" },
          { title: "オチ：鮮やかな回収と余韻", content: "【オチ（解決・余韻）】\n読者の予想を裏切るどんでん返し、あるいはじんわり温かい余韻。\n\n◆ 執筆 of ヒント疑問:\nQ. プロット上のミスディレクション（読者の目を逸らす手法）はどう仕掛けますか？\nQ. 最後のワンフレーズ、印象的なセリフで綺麗にオチをつけましょう。", phase: "結", timelineDate: "後半・ラスト3分" }
        ];

        const initialMemo = {
          title: "📝 短編執筆へのアドバイス",
          content: "短いストーリーでは余計な設定を語りすぎないのが黄金律。1つのメインアイデアやセリフに向けて、登場人物の感情をストレートにぶつけましょう！",
          color: "#f0f9ff"
        };

        for (const p of plotsToCreate) {
          await fetch(`/api/novels/${novelId}/plots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p)
          });
        }
        await fetch(`/api/novels/${novelId}/memos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialMemo)
        });
      }
      setSyncStatus("synced");
    } catch (e) {
      console.warn("Template creation offline/skipped", e);
      setSyncStatus("offline");
    }
  };

  // --- Novels Handlers (CRUD & Theme management) ---
  const handleOpenNovelModal = (novel?: Novel) => {
    if (!novel && novels.length >= 3 && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedTemplate("none"); // reset
    if (novel) {
      setEditingNovel(novel);
      setNewNovelTitle(novel.title);
      setNewNovelDesc(novel.description || "");
      setNewNovelCover(novel.coverImage || "");
      setNewNovelTheme(novel.themeDoc || "");
      setNewNovelAudience(novel.targetAudience || "");
      setNewNovelEnding(novel.endingDoc || "");
      setNewNovelWordGoal(String(novel.wordGoal || 50000));
      setNewNovelWriteDays(String(novel.writeDays || 30));
    } else {
      setEditingNovel(null);
      setNewNovelTitle("");
      setNewNovelDesc("");
      setNewNovelCover("");
      setNewNovelTheme("");
      setNewNovelAudience("");
      setNewNovelEnding("");
      setNewNovelWordGoal("50000");
      setNewNovelWriteDays("30");
    }
    setShowNovelModal(true);
  };

  const handleCreateOrUpdateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNovelTitle.trim()) return;

    setSyncStatus("saving");
    const payload = {
      title: newNovelTitle,
      description: newNovelDesc,
      coverImage: newNovelCover,
      themeDoc: newNovelTheme,
      targetAudience: newNovelAudience,
      endingDoc: newNovelEnding,
      wordGoal: Number(newNovelWordGoal) || 50000,
      writeDays: Number(newNovelWriteDays) || 30,
    };

    try {
      if (editingNovel) {
        // Update
        const res = await fetch(`/api/novels/${editingNovel.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setNovels(novels.map((n) => (n.id === editingNovel.id ? updated : n)));
          if (selectedNovel?.id === editingNovel.id) {
            setSelectedNovel(updated);
          }
        } else {
          // offline/fallback
          throw new Error("API update failed");
        }
      } else {
        // Create
        const res = await fetch("/api/novels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setNovels([...novels, created]);
          setSelectedNovel(created); // 新規作成されたら自動的にアトリエ選択状態（アクティブ）へ！
          if (selectedTemplate !== "none") {
            await createTemplateData(created.id, selectedTemplate);
          }
        } else {
          throw new Error("API creation failed");
        }
      }
      setSyncStatus("synced");
      setShowNovelModal(false);
    } catch (err) {
      console.warn("Server update failed, saving locally via offline sync engine", err);
      const offlineId = editingNovel ? editingNovel.id : `novel-${Date.now()}`;
      const offlineNovel: Novel = {
        id: offlineId,
        ...payload,
        createdAt: editingNovel ? editingNovel.createdAt : new Date(),
      };

      if (editingNovel) {
        setNovels(novels.map((n) => (n.id === editingNovel.id ? offlineNovel : n)));
        if (selectedNovel?.id === editingNovel.id) {
          setSelectedNovel(offlineNovel);
        }
      } else {
        setNovels([...novels, offlineNovel]);
        setSelectedNovel(offlineNovel); // オフライン新規作成でも自動選択！
        // オフライン用簡易テンプレート初期化
        if (selectedTemplate === "novel_long") {
          const offlinePlots = [
            { id: `plot-off-1-${Date.now()}`, novelId: offlineId, title: "起：日常と事件の発生", content: "【起（導入）】\n日常と不思議な事件の発生。", phase: "起" as const, timelineDate: "序盤" },
            { id: `plot-off-2-${Date.now()}`, novelId: offlineId, title: "承：展開と葛藤", content: "【承（展開）】\n葛藤や絆。", phase: "承" as const, timelineDate: "中盤" },
            { id: `plot-off-3-${Date.now()}`, novelId: offlineId, title: "転：クライマックス", content: "【転（クライマックス）】\n絶体絶命のピンチ。", phase: "転" as const, timelineDate: "終盤" },
            { id: `plot-off-4-${Date.now()}`, novelId: offlineId, title: "結：解決・大団円", content: "【結（解決）】\n問題解決と成長した姿。", phase: "結" as const, timelineDate: "結び" }
          ];
          const offlineMemo = {
            id: `memo-off-1-${Date.now()}`,
            novelId: offlineId,
            title: "🌸 長編執筆へのアドバイス",
            content: "まずはプロットを骨組みとして完成させましょう。",
            color: "#fdf2f8",
            createdAt: new Date()
          };
          setPlots((prev) => [...prev, ...offlinePlots]);
          setMemos((prev) => [...prev, offlineMemo]);
        } else if (selectedTemplate === "novel_short") {
          const offlinePlots = [
            { id: `plot-off-1-${Date.now()}`, novelId: offlineId, title: "はじまり：日常と変化", content: "短い描写で惹きつける。", phase: "起" as const, timelineDate: "前半" },
            { id: `plot-off-2-${Date.now()}`, novelId: offlineId, title: "オチ：鮮やかな回収", content: "裏切りとオチ。", phase: "結" as const, timelineDate: "後半" }
          ];
          const offlineMemo = {
            id: `memo-off-2-${Date.now()}`,
            novelId: offlineId,
            title: "📝 短編執筆へのアドバイス",
            content: "余計な設定を語りすぎないのが黄金律。",
            color: "#f0f9ff",
            createdAt: new Date()
          };
          setPlots((prev) => [...prev, ...offlinePlots]);
          setMemos((prev) => [...prev, offlineMemo]);
        }
      }
      setSyncStatus("offline");
      setShowNovelModal(false);
    }
  };

  const handleDeleteNovel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("本当にこのプロット・小説アトリエ設定をすべて削除する？（取り消せません）")) return;

    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/novels/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNovels(novels.filter((n) => n.id !== id));
        if (selectedNovel?.id === id) setSelectedNovel(null);
        setSyncStatus("synced");
      } else {
        throw new Error("Delete API failed");
      }
    } catch (e) {
      console.warn("Offline action: deleting locally", e);
      setNovels(novels.filter((n) => n.id !== id));
      if (selectedNovel?.id === id) setSelectedNovel(null);
      setSyncStatus("offline");
    }
  };

  // --- Plots Handlers ---
  const handleOpenPlotModal = (plot?: Plot) => {
    if (plot) {
      setEditingPlot(plot);
      setNewPlotTitle(plot.title);
      setNewPlotContent(plot.content || "");
      setNewPlotPhase(plot.phase || "起");
      setNewPlotTimeline(plot.timelineDate || "");
    } else {
      setEditingPlot(null);
      setNewPlotTitle("");
      setNewPlotContent("");
      setNewPlotPhase("起");
      setNewPlotTimeline("");
    }
    setShowPlotModal(true);
  };

  const handleCreateOrUpdatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || !newPlotTitle.trim()) return;

    setSyncStatus("saving");
    const payload = {
      title: newPlotTitle,
      content: newPlotContent,
      phase: newPlotPhase,
      timelineDate: newPlotTimeline,
    };

    try {
      if (editingPlot) {
        // Update
        const res = await fetch(`/api/novels/${selectedNovel.id}/plots/${editingPlot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setPlots(plots.map((p) => (p.id === editingPlot.id ? updated : p)));
        } else {
          throw new Error("Update API failed");
        }
      } else {
        // Create
        const res = await fetch(`/api/novels/${selectedNovel.id}/plots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setPlots([...plots, created]);
        } else {
          throw new Error("Create API failed");
        }
      }
      setSyncStatus("synced");
      setShowPlotModal(false);
    } catch (err) {
      console.warn("API offline - rendering plot locally", err);
      const offlineId = editingPlot ? editingPlot.id : `plot-${Date.now()}`;
      const offlinePlot: Plot = {
        id: offlineId,
        novelId: selectedNovel.id,
        ...payload,
      };

      if (editingPlot) {
        setPlots(plots.map((p) => (p.id === editingPlot.id ? offlinePlot : p)));
      } else {
        setPlots([...plots, offlinePlot]);
      }
      setSyncStatus("offline");
      setShowPlotModal(false);
    }
  };

  const handleDeletePlot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNovel || !confirm("このプロットを削除してもいい？")) return;

    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/plots/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlots(plots.filter((p) => p.id !== id));
        setSyncStatus("synced");
      } else {
        throw new Error();
      }
    } catch (e) {
      setPlots(plots.filter((p) => p.id !== id));
      setSyncStatus("offline");
    }
  };

  // --- Characters Handlers ---
  const handleOpenCharModal = (char?: Character) => {
    if (char) {
      setEditingChar(char);
      setNewCharName(char.name);
      setNewCharRole(char.role || "");
      setNewCharAge(char.age || "");
      setNewCharDesc(char.description || "");
      setNewCharAppearance(char.appearance || "");
      setNewCharPersonality(char.personality || "");
      setNewCharRelation(char.relationInfo || "");
      setNewCharImageUrl(char.imageUrl || "");
    } else {
      setEditingChar(null);
      setNewCharName("");
      setNewCharRole("");
      setNewCharAge("");
      setNewCharDesc("");
      setNewCharAppearance("");
      setNewCharPersonality("");
      setNewCharRelation("");
      setNewCharImageUrl("");
    }
    setShowCharModal(true);
  };

  const handleCreateOrUpdateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || !newCharName.trim()) return;

    setSyncStatus("saving");
    const payload = {
      name: newCharName,
      role: newCharRole,
      age: newCharAge,
      description: newCharDesc,
      appearance: newCharAppearance,
      personality: newCharPersonality,
      relationInfo: newCharRelation,
      imageUrl: newCharImageUrl,
    };

    try {
      if (editingChar) {
        // Update
        const res = await fetch(`/api/novels/${selectedNovel.id}/characters/${editingChar.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setCharacters(characters.map((c) => (c.id === editingChar.id ? updated : c)));
        } else {
          throw new Error();
        }
      } else {
        // Create
        const res = await fetch(`/api/novels/${selectedNovel.id}/characters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setCharacters([...characters, created]);
        } else {
          throw new Error();
        }
      }
      setSyncStatus("synced");
      setShowCharModal(false);
    } catch (err) {
      console.warn("API offline - rendering character locally", err);
      const offlineId = editingChar ? editingChar.id : `char-${Date.now()}`;
      const offlineChar: Character = {
        id: offlineId,
        novelId: selectedNovel.id,
        ...payload,
      };

      if (editingChar) {
        setCharacters(characters.map((c) => (c.id === editingChar.id ? offlineChar : c)));
      } else {
        setCharacters([...characters, offlineChar]);
      }
      setSyncStatus("offline");
      setShowCharModal(false);
    }
  };

  const handleDeleteCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNovel || !confirm("この登場人物をパレットから削除する？")) return;

    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/characters/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCharacters(characters.filter((c) => c.id !== id));
        setSyncStatus("synced");
      } else {
        throw new Error();
      }
    } catch (e) {
      setCharacters(characters.filter((c) => c.id !== id));
      setSyncStatus("offline");
    }
  };

  // --- World Settings (資料) Handlers ---
  const handleOpenWorldModal = (setDoc?: SettingWorld) => {
    if (setDoc) {
      setEditingWorld(setDoc);
      setNewWorldTitle(setDoc.title);
      setNewWorldCategory(setDoc.category);
      setNewWorldDetail(setDoc.detail || "");
      setNewWorldIsFusen(!!setDoc.isFusen);
      setNewWorldFusenStatus(setDoc.fusenStatus || "未回収");
    } else {
      setEditingWorld(null);
      setNewWorldTitle("");
      setNewWorldCategory("世界観");
      setNewWorldDetail("");
      setNewWorldIsFusen(false);
      setNewWorldFusenStatus("未回収");
    }
    setShowWorldModal(true);
  };

  const handleCreateOrUpdateSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || !newWorldTitle.trim()) return;

    setSyncStatus("saving");
    const payload = {
      title: newWorldTitle,
      category: newWorldCategory,
      detail: newWorldDetail,
      isFusen: newWorldIsFusen,
      fusenStatus: newWorldFusenStatus,
    };

    try {
      if (editingWorld) {
        // Update
        const res = await fetch(`/api/novels/${selectedNovel.id}/settings/${editingWorld.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setWorldSettings(worldSettings.map((s) => (s.id === editingWorld.id ? updated : s)));
        } else {
          throw new Error();
        }
      } else {
        // Create
        const res = await fetch(`/api/novels/${selectedNovel.id}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setWorldSettings([...worldSettings, created]);
        } else {
          throw new Error();
        }
      }
      setSyncStatus("synced");
      setShowWorldModal(false);
    } catch (err) {
      console.warn("Offline fallback world setting", err);
      const offlineId = editingWorld ? editingWorld.id : `set-${Date.now()}`;
      const offlineDoc: SettingWorld = {
        id: offlineId,
        novelId: selectedNovel.id,
        ...payload,
      };

      if (editingWorld) {
        setWorldSettings(worldSettings.map((s) => (s.id === editingWorld.id ? offlineDoc : s)));
      } else {
        setWorldSettings([...worldSettings, offlineDoc]);
      }
      setSyncStatus("offline");
      setShowWorldModal(false);
    }
  };

  const handleDeleteSetting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNovel || !confirm("この世界観資料・伏線設定を削除する？")) return;

    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/settings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorldSettings(worldSettings.filter((s) => s.id !== id));
        setSyncStatus("synced");
      } else {
        throw new Error();
      }
    } catch (e) {
      setWorldSettings(worldSettings.filter((s) => s.id !== id));
      setSyncStatus("offline");
    }
  };

  // --- Memos/Idea Handlers ---
  const handleOpenMemoModal = (memo?: MemoIdea) => {
    if (memo) {
      setEditingMemo(memo);
      setNewMemoTitle(memo.title);
      setNewMemoContent(memo.content || "");
      setNewMemoColor(memo.color || "#fffbeb");
    } else {
      setEditingMemo(null);
      setNewMemoTitle("");
      setNewMemoContent("");
      setNewMemoColor("#fffbeb");
    }
    setShowMemoModal(true);
  };

  const handleCreateOrUpdateMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || (!newMemoTitle.trim() && !newMemoContent.trim())) return;

    setSyncStatus("saving");
    const payload = {
      title: newMemoTitle || "無題のひらめき",
      content: newMemoContent,
      color: newMemoColor,
    };

    try {
      if (editingMemo) {
        // Update
        const res = await fetch(`/api/novels/${selectedNovel.id}/memos/${editingMemo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setMemos(memos.map((m) => (m.id === editingMemo.id ? updated : m)));
        } else {
          throw new Error();
        }
      } else {
        // Create
        const res = await fetch(`/api/novels/${selectedNovel.id}/memos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setMemos([...memos, created]);
        } else {
          throw new Error();
        }
      }
      setSyncStatus("synced");
      setShowMemoModal(false);
    } catch (err) {
      console.warn("Offline action: saving memo locally", err);
      const offlineId = editingMemo ? editingMemo.id : `memo-${Date.now()}`;
      const offlineDoc: MemoIdea = {
        id: offlineId,
        novelId: selectedNovel.id,
        ...payload,
        createdAt: new Date(),
      };

      if (editingMemo) {
        setMemos(memos.map((m) => (m.id === editingMemo.id ? offlineDoc : m)));
      } else {
        setMemos([...memos, offlineDoc]);
      }
      setSyncStatus("offline");
      setShowMemoModal(false);
    }
  };

  const handleDeleteMemo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNovel || !confirm("このメモを捨てちゃう？")) return;

    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/memos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemos(memos.filter((m) => m.id !== id));
        setSyncStatus("synced");
      } else {
        throw new Error();
      }
    } catch (e) {
      setMemos(memos.filter((m) => m.id !== id));
      setSyncStatus("offline");
    }
  };

  // --- Episodes/Writing Studio Handlers ---
  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || !newEpisodeTitle.trim()) return;

    setSyncStatus("saving");
    const payload = {
      title: newEpisodeTitle,
      body: "",
      status: newEpisodeStatus,
      tag: newEpisodeTag,
      wordCount: 0,
    };

    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setEpisodes([...episodes, created]);
        setActiveEpisode(created);
        setShowEpisodeModal(false);
        setNewEpisodeTitle("");
        setSyncStatus("synced");
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn("Offline episode creation", err);
      const offlineDoc: Episode = {
        id: `epi-${Date.now()}`,
        novelId: selectedNovel.id,
        ...payload,
      };
      setEpisodes([...episodes, offlineDoc]);
      setActiveEpisode(offlineDoc);
      setShowEpisodeModal(false);
      setNewEpisodeTitle("");
      setSyncStatus("offline");
    }
  };

  const handleUpdateEpisodeBody = (bodyText: string) => {
    if (!selectedNovel || !activeEpisode) return;

    const count = bodyText.length;
    const updatedDoc = {
      ...activeEpisode,
      body: bodyText,
      wordCount: count,
    };

    // Fast UI state reactive update
    setActiveEpisode(updatedDoc);
    setEpisodes(episodes.map((e) => (e.id === activeEpisode.id ? updatedDoc : e)));

    // Debounce / direct save
    setSyncStatus("saving");
    fetch(`/api/novels/${selectedNovel.id}/episodes/${activeEpisode.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDoc),
    })
      .then((res) => {
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
        }
      })
      .catch(() => {
        setSyncStatus("offline");
      });
  };

  const handleToggleEpisodeStatus = (status: "下書き" | "完成" | "推敲中") => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode, status };
    setActiveEpisode(updated);
    setEpisodes(episodes.map((e) => (e.id === activeEpisode.id ? updated : e)));
    handleUpdateEpisodeBody(activeEpisode.body); // Propagate status update through normal body save route
  };

  const handleDeleteEpisode = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNovel || !confirm("このエピソードを完全に削除する？書いた本文も消えちゃいます。")) return;

    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/episodes/${id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = episodes.filter((e) => e.id !== id);
        setEpisodes(remaining);
        if (activeEpisode?.id === id) {
          setActiveEpisode(remaining.length > 0 ? remaining[0] : null);
        }
        setSyncStatus("synced");
      } else {
        throw new Error();
      }
    } catch (e) {
      const remaining = episodes.filter((e) => e.id !== id);
      setEpisodes(remaining);
      if (activeEpisode?.id === id) {
        setActiveEpisode(remaining.length > 0 ? remaining[0] : null);
      }
      setSyncStatus("offline");
    }
  };

  // --- Nora Word Tracker Calculator & Stats ---
  const currentTotalWords = episodes.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const wordPercentage = selectedNovel?.wordGoal 
    ? Math.min(100, Math.round((currentTotalWords / selectedNovel.wordGoal) * 100)) 
    : 0;

  // Track progress comments dynamically from Gemini (パレットコンシェルジュ)
  const getGeminiAdvice = () => {
    if (wordPercentage >= 100) {
      return "おめでとうございます！目標100%達成です！本当に素晴らしい筆力ですね。この勢いのまま、素晴らしいエンディングへと駆け抜けましょう！🌸";
    } else if (wordPercentage >= 70) {
      return "執筆が信じられないほど捗っていますね！プロットと本編のシンクロが本当に美しいです。リフレッシュを挟みながら、ラストスパートに向かいましょう！☕";
    } else if (wordPercentage >= 40) {
      return "物語もいよいよ中盤戦ですね！伏線回収のタイミングはバッチリですか？ひらめいたセリフやアイデアはメモに溜めておくと、あとでパズルのようにハマりますよ！🎨";
    } else if (wordPercentage > 0) {
      return "第一歩が踏み出せましたね！その調子でエピソードを1つずつ、あなたのパレットで鮮やかに彩っていきましょう！応援しています！🌟";
    } else {
      return "最初の一行が一番勇気が要るものです。まずは頭の中にあるプロットや、お気に入りのシーンの一幕を原稿用紙に置いてみませんか？準備はいつでも万端です！⚙️";
    }
  };

  // --- Manus style Markdown Exporter ---
  const handleExportMarkdown = () => {
    if (!selectedNovel) return;

    let mdContent = `# 物語設定：${selectedNovel.title}\n\n`;
    mdContent += `> あらすじ・解説:\n> ${selectedNovel.description || "設定なし"}\n\n`;

    mdContent += `## 🎨 世界観・テーマドキュメント\n`;
    mdContent += `- **主題 (Theme):** ${selectedNovel.themeDoc || "未定義"}\n`;
    mdContent += `- **ターゲット読者:** ${selectedNovel.targetAudience || "未定義"}\n`;
    mdContent += `- **結末の想定:** ${selectedNovel.endingDoc || "未定義"}\n`;
    mdContent += `- **目標字数:** ${selectedNovel.wordGoal || 50000} 字 / **目標日数:** ${selectedNovel.writeDays || 30} 日\n\n`;

    mdContent += `## 🕒 起承転結プロット構築 & タイムライン\n`;
    if (plots.length === 0) mdContent += "*プロット未作成*\n\n";
    plots.forEach((p, idx) => {
      mdContent += `### ${idx + 1}. [${p.phase || "未設定"}] ${p.title}\n`;
      if (p.timelineDate) mdContent += `*時系列ラベル: ${p.timelineDate}*\n\n`;
      mdContent += `${p.content || "内容なし"}\n\n`;
    });

    mdContent += `## 👥 キャラクター設計パレット\n`;
    if (characters.length === 0) mdContent += "*登場人物未設定*\n\n";
    characters.forEach((c) => {
      mdContent += `### 【${c.role || "脇役"}】${c.name} (${c.age || "年齢不詳"}歳)\n`;
      mdContent += `- **外見:** ${c.appearance || "未設定"}\n`;
      mdContent += `- **性格・MBTI:** ${c.personality || "未設定"}\n`;
      mdContent += `- **関係性設定:** ${c.relationInfo || "未設定"}\n`;
      if (c.customFields && c.customFields.length > 0) {
        mdContent += `**追加項目:**\n`;
        c.customFields.forEach(cf => {
          mdContent += `- **${cf.key}:** ${cf.value}\n`;
        });
      }
      mdContent += `**バックストーリー:**\n${c.description || "詳細なし"}\n\n`;
    });

    mdContent += `## 📖 世界観資料・伏線管理ボード\n`;
    if (worldSettings.length === 0) mdContent += "*資料未追加*\n\n";
    worldSettings.forEach((w) => {
      mdContent += `### [${w.category}] ${w.title} ${w.isFusen ? `(🔍 伏線: ${w.fusenStatus})` : ""}\n`;
      mdContent += `${w.detail || "詳細なし"}\n\n`;
    });

    mdContent += `## 📝 ひらめきアイデア・セリフ集メモ\n`;
    if (memos.length === 0) mdContent += "*メモ未作成*\n\n";
    memos.forEach((v) => {
      mdContent += `### 💡 ${v.title}\n`;
      mdContent += `${v.content || "空の内容"}\n\n`;
    });

    mdContent += `## ✍️ 本文執筆セクション (結合原稿)\n`;
    if (episodes.length === 0) mdContent += "*本文未執筆*\n\n";
    episodes.forEach((e) => {
      mdContent += `### ${e.title} (${e.tag} / 状態: ${e.status})\n`;
      mdContent += `${e.body || "本文未執筆"}\n\n`;
      mdContent += `---\n\n`;
    });

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedNovel.title}_full_bundle.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50/20">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 border-4 border-pink-500/10 border-t-pink-500 rounded-full animate-spin"></div>
          <Palette className="text-pink-500 w-8 h-8 animate-pulse text-2xl" />
        </div>
        <p className="mt-8 text-pink-600/80 font-sans tracking-widest text-sm animate-pulse">
          創作スタジオのカラーパレットを読み込み中... 🎨
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const displayName = user.name || "ストーリーテラー";

  const isCustom = themeState === "custom" && isPremium;
  const customStyles = isCustom ? {
    "--bg-app": customBg,
    "--bg-card": customCard,
    "--bg-sidebar": customBg,
    "--text-main": customText,
    "--border-color": customBorder,
    "--accent-color": customAccent,
    "--text-muted": customText + "bf",
    "--accent-light": customAccent + "20",
    "--custom-bg": customBg,
    "--custom-card": customCard,
    "--custom-text": customText,
    "--custom-border": customBorder,
    "--custom-accent": customAccent,
    "--custom-accent-light": customAccent + "20",
    backgroundColor: customBg,
    color: customText
  } as React.CSSProperties : undefined;

  return (
    <div 
      className={`min-h-screen palette-${themeState} text-slate-800 font-sans transition-all selection:bg-pink-100 selection:text-pink-900`} 
      style={customStyles || { backgroundColor: "var(--bg-app)", color: "var(--text-main)" }}
    >
      <Toaster position="top-center" />
      {/* --- ヘッダー (可愛らしくモダンなピンク＆パレット調、およびカスタムテーマ対応) --- */}
      <header 
        className="backdrop-blur border-b sticky top-0 z-40 px-3 md:px-6 py-2.5 md:py-4 flex items-center justify-between shadow-sm transition-all"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
      >
        <div 
          className="flex items-center gap-2 md:gap-3 cursor-pointer"
          onClick={() => setSelectedNovel(null)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center text-white shadow-md shadow-pink-200/50 shrink-0">
            <Palette className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 
              className="text-[14px] md:text-lg font-sans font-extrabold tracking-wider bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent flex items-center gap-1.5"
              style={{ color: "transparent" }}
            >
              Plot Palette <span className="text-[9px] md:text-[10px] bg-pink-500 text-white px-1.5 md:px-2 py-0 md:py-0.5 rounded-full font-bold shadow-sm">Studio</span>
            </h1>
            <p className="text-[7px] md:text-[9px] text-pink-400 font-semibold tracking-wider uppercase leading-tight md:leading-normal">Creative Story Generator</p>
          </div>
        </div>

        {/* コミュニケーション ＆ ユティリティエリア */}
        <div className="flex items-center gap-3 select-none relative">
          
          {/* PC・デスクトップ専用 メニュー群 */}
          <div className="hidden md:flex items-center gap-2">
            {/* 使い方マニュアルボタン */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition text-slate-700"
              title="あつかいかた・仕様説明書"
            >
              <HelpCircle className="w-4 h-4 text-slate-500 animate-pulse" />
              <span>使い方💡</span>
            </button>

            {/* 作品シェアボタン */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition text-slate-700"
              title="作品・当アトリエを世に宣伝シェア"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>アトリエをシェア📢</span>
            </button>
          </div>

          {/* パレットテーマ着せ替えトグル (おしゃれドロップダウン) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-slate-50 hover:bg-slate-100 border border-slate-200/60 shadow-sm transition text-slate-700"
              title="カラーパレットを変更"
            >
              <Palette className="w-3.5 h-3.5 text-pink-500 animate-spin-slow" />
              <span>パレット🎨</span>
            </button>

            {/* パレットテーマPopoverメニュー */}
            {showPaletteMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150"
                style={{ color: "#1f2937" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-[10px] font-black text-rose-800 tracking-wider uppercase">創作パレットを染める</h5>
                  <button 
                    onClick={() => setShowPaletteMenu(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    閉じる
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { id: "light", name: "ライト(昼)", bg: "bg-white", text: "text-slate-700" },
                    { id: "dark", name: "ダーク(夜)", bg: "bg-slate-800", text: "text-white" },
                    { id: "sakura", name: "桜パレット🌸", bg: "bg-pink-100", text: "text-pink-800", premium: true },
                    { id: "parchment", name: "羊皮紙🕯️", bg: "bg-amber-50", text: "text-amber-800", premium: true },
                    { id: "night", name: "夜空群青🌃", bg: "bg-indigo-950", text: "text-indigo-100", premium: true },
                    { id: "manuscript", name: "原稿用紙🌿", bg: "bg-emerald-50", text: "text-emerald-800", premium: true },
                    { id: "custom", name: "1600万色カスタム🎨", bg: "bg-gradient-to-tr from-pink-200 via-rose-200 to-amber-200", text: "text-rose-800", premium: true }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        handleSelectTheme(t.id as any);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold border transition ${
                        themeState === t.id 
                          ? "border-pink-500 bg-pink-50/50 text-pink-700" 
                          : "border-slate-100 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0 ${t.bg}`} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>

                {/* カスタムカラー調色パネル */}
                {themeState === "custom" && isPremium && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-2.5 text-slate-700">
                    <div className="flex items-center justify-between text-[10px] font-bold text-pink-600">
                      <span>✨ 1600万色調色パレット</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomBg("#fff5f6");
                          setCustomCard("#ffffff");
                          setCustomText("#4c0519");
                          setCustomBorder("#fecdd3");
                          setCustomAccent("#db2777");
                          localStorage.setItem("palette_custom_bg", "#fff5f6");
                          localStorage.setItem("palette_custom_card", "#ffffff");
                          localStorage.setItem("palette_custom_text", "#4c0519");
                          localStorage.setItem("palette_custom_border", "#fecdd3");
                          localStorage.setItem("palette_custom_accent", "#db2777");
                        }}
                        className="text-[9px] text-slate-400 hover:text-pink-600 underline font-semibold"
                      >
                        リセット
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <input 
                          type="color" 
                          value={customBg} 
                          onChange={(e) => {
                            setCustomBg(e.target.value);
                            localStorage.setItem("palette_custom_bg", e.target.value);
                          }}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0" 
                        />
                        <span>全体の背景</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <input 
                          type="color" 
                          value={customCard} 
                          onChange={(e) => {
                            setCustomCard(e.target.value);
                            localStorage.setItem("palette_custom_card", e.target.value);
                          }}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0" 
                        />
                        <span>カード背景</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <input 
                          type="color" 
                          value={customText} 
                          onChange={(e) => {
                            setCustomText(e.target.value);
                            localStorage.setItem("palette_custom_text", e.target.value);
                          }}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0" 
                        />
                        <span>文字の色</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <input 
                          type="color" 
                          value={customBorder} 
                          onChange={(e) => {
                            setCustomBorder(e.target.value);
                            localStorage.setItem("palette_custom_border", e.target.value);
                          }}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0" 
                        />
                        <span>枠線の色</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-600">
                      <input 
                        type="color" 
                        value={customAccent} 
                        onChange={(e) => {
                          setCustomAccent(e.target.value);
                          localStorage.setItem("palette_custom_accent", e.target.value);
                        }}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0" 
                      />
                      <span className="flex-1">テーマアクセント色</span>
                    </div>
                  </div>
                )}

                {themeState === "custom" && !isPremium && (
                  <div className="pt-2 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaletteMenu(false);
                        setShowPremiumModal(true);
                      }}
                      className="text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-2 rounded-full inline-block tracking-wide transition animate-pulse"
                    >
                      👑 カスタム調色はプレミアム特典
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* プレミアム快適化アップグレードボタン */}
          <button
            onClick={() => setShowPremiumModal(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold shadow-sm transition ${
              isPremium 
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-amber-200/40"
                : "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-pink-100 hover:brightness-105"
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isPremium ? "プレミアム" : "プレミアム快適化👑"}</span>
          </button>

          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold" style={{ color: "var(--text-main)" }}>
              <strong className="text-pink-600 font-extrabold">{displayName}</strong> さん
            </span>
            <button
              onClick={() => { setShowDbStatusModal(true); checkDbStatus(); }}
              className="flex items-center gap-1 justify-end mt-0.5 hover:opacity-80 transition cursor-pointer text-left focus:outline-none"
              title="クラウド同期診断を開く"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === "synced" ? "bg-emerald-500 animate-pulse" : "bg-pink-400"
              }`} />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider underline decoration-dotted decoration-slate-300">
                {syncStatus === "synced" ? "同期完了 (診断 📡)" : syncStatus === "saving" ? "同調中..." : "オフライン (診断 📡)"}
              </span>
            </button>
          </div>

          {/* 全文検索ボタン */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-1.5 text-slate-400 hover:text-pink-500 hover:bg-pink-50/50 rounded-lg transition"
            title="創作情報の横断全文検索"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 通知ベル＆バッジ */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-slate-400 hover:text-pink-500 hover:bg-pink-50/50 rounded-lg transition"
              title="通知"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" />
              )}
            </button>

            {/* 通知ドロップダウンパネル */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-pink-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-pink-50/50 border-b border-pink-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> お知らせ・執筆ヒント
                  </span>
                  <button
                    onClick={() => {
                      setNotifications(notifications.map(n => ({ ...n, read: true })));
                      localStorage.setItem("plot_palette_notifications_v1", JSON.stringify(notifications.map(n => ({ ...n, read: true }))));
                    }}
                    className="text-[10px] text-pink-500 hover:underline"
                  >
                    すべて既読
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-pink-50/50">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">通知はありません</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 text-xs transition duration-200 ${n.read ? 'bg-white text-slate-500' : 'bg-pink-50/10 text-slate-800 font-medium'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] ${
                            n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : n.type === 'warning' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {n.type === 'success' ? '達成' : n.type === 'warning' ? 'アラート' : 'ヒント'}
                          </span>
                          <span className="text-[9px] text-slate-400">{n.date}</span>
                        </div>
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-slate-500 mt-0.5 leading-relaxed">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* スマホ用ハンバーガートリガー */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 text-slate-500 bg-slate-50 border border-slate-200/60 rounded-xl hover:text-pink-600 hover:bg-pink-50 transition"
              title="コンソールメニューを展開"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* スマホ用展開パネル */}
          {showMobileMenu && (
            <div 
              className="md:hidden absolute right-0 top-11 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3.5 z-50 flex flex-col gap-2 text-left animate-in fade-in slide-in-from-top-2 duration-150"
              style={{ color: "#1f2937" }}
            >
              <div className="flex justify-between items-center pb-2 border-b border-rose-50/80 mb-1">
                <span className="text-[10px] font-black tracking-wider uppercase bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">創作コンソール</span>
                <button onClick={() => setShowMobileMenu(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">閉じる</button>
              </div>

              <button
                type="button"
                onClick={() => { setShowHelpModal(true); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition text-left"
              >
                <HelpCircle className="w-4 h-4 text-pink-500 shrink-0" />
                <span>使い方マニュアル💡</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowShareModal(true); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition text-left"
              >
                <Share2 className="w-4 h-4 text-pink-500 shrink-0" />
                <span>アトリエをシェア📢</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowDbStatusModal(true); checkDbStatus(); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-600 transition text-left"
              >
                <CloudLightning className="w-4 h-4 text-violet-500 shrink-0" />
                <span>クラウド同期診断 📡</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowPaletteMenu(!showPaletteMenu); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition text-left"
              >
                <Palette className="w-4 h-4 text-pink-500 shrink-0" />
                <span>パレットを変更🎨</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowPremiumModal(true); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-50 transition text-left"
              >
                <Crown className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                <span>プレミアム快適化👑</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowSearchModal(true); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-pink-50 transition text-left"
              >
                <Search className="w-4 h-4 text-pink-500 shrink-0" />
                <span>情報を全文検索🔍</span>
              </button>

              <div className="border-t border-slate-100 my-1 pt-1"></div>

              <button
                type="button"
                onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-left"
              >
                ログアウト
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden sm:flex text-xs bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-full font-bold transition border border-slate-200 shadow-sm items-center gap-1.5"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* --- メインコンテンツ --- */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
        {!selectedNovel ? (
          
          /* ========================================================
             小説選択・一覧アトリエ UI
             ======================================================== */
          <div>
            {/* 可愛いウェルカムボード (一般ユーザー向け、明るく可愛いグラデーション配色) */}
            <div className="bg-gradient-to-br from-pink-500/90 via-rose-400/95 to-amber-300 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden ring-1 ring-pink-300/20">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 scale-150 text-white">
                <Compass className="w-96 h-96 animate-pulse" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="bg-white/20 text-white backdrop-blur border border-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5" /> Story Concept Board 🎨
                </span>
                <h2 className="text-2xl md:text-3xl font-sans font-black text-white mt-4 mb-2 tracking-wide leading-tight">
                  おかえりなさい！今日はどんなストーリーを紡ぎますか？
                </h2>
                <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
                  Plot Paletteは、起承転結のプロット設計、魅力的な登場人物パレット、人物相関図、世界観の設定資料をパレットのように鮮やかに整理し、極上のシームレスさを備えた執筆環境で物語の完成を徹底的にサポートする全天候型創作アトリエです。
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleOpenNovelModal()}
                    className="bg-white hover:bg-pink-50 text-pink-600 font-extrabold px-6 py-3 rounded-xl hover:shadow-lg transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2 text-sm shadow-md"
                  >
                    <Plus className="w-4 h-4 text-pink-600" /> 新しい物語を創作する
                  </button>
                  <a 
                    href="https://mofu-mitsu.github.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white/30 text-white font-extrabold px-6 py-3 rounded-xl hover:shadow-lg transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2 text-sm backdrop-blur"
                  >
                    <Home className="w-4 h-4 text-white" />
                    ホームへ戻る
                  </a>
                  <a 
                    href="https://mofu-mitsu.github.io/orikyara-relationship-chart/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-5 py-3 rounded-xl border border-white/20 transition text-xs flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> 立ち上げ：相関図メーカー
                  </a>
                </div>
              </div>
            </div>

            {/* 小説一覧セクション */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-sans font-extrabold text-slate-800 flex items-center gap-2">
                <Book className="text-pink-500 w-5 h-5 animate-bounce" />
                作品一覧
              </h3>
              <span className="text-xs bg-pink-50 px-3 py-1 rounded-full text-pink-600 font-bold border border-pink-100">
                {novels.length} 作品が登録されています
              </span>
            </div>

            {novels.length === 0 ? (
              <div className="bg-white border border-pink-100/50 rounded-2xl p-12 text-center shadow-inner">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-50 rounded-full text-pink-500 mb-4">
                  <Feather className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">パレットがまだ真っ白です</h4>
                <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">
                  まずは、最初の物語タイトルだけを入力して、あなたの創作パレットの扉を開きましょう！
                </p>
                <button
                  onClick={() => handleOpenNovelModal()}
                  className="bg-pink-5050 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition"
                >
                  物語を作成する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {novels.map((novel) => (
                  <div
                    key={novel.id}
                    onClick={() => setSelectedNovel(novel)}
                    className="bg-white rounded-2xl border border-amber-900/10 shadow-sm hover:shadow-lg hover:border-amber-900/30 transition duration-300 cursor-pointer overflow-hidden flex flex-col group relative"
                  >
                    <div className="h-40 overflow-hidden relative bg-gradient-to-br from-amber-100 to-rose-100">
                      <img
                        src={novel.coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400"}
                        alt={novel.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-4 flex gap-2">
                        <span className="bg-amber-950/85 backdrop-blur-sm text-amber-100 text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded">
                          {novel.wordGoal ? `${novel.wordGoal}字目標` : "小説作品"}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-base font-serif font-black text-amber-950 mb-1.5 truncate group-hover:text-rose-800 transition">
                          {novel.title}
                        </h4>
                        <p className="text-amber-950/60 text-xs leading-relaxed line-clamp-2">
                          {novel.description || "あらすじや概要設定はこれから追加できるよ。クリックしてアトリエを広げよう。"}
                        </p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-amber-900/5 flex items-center justify-between text-xs">
                        <span className="text-rose-800 font-bold flex items-center gap-1">
                          アトリエに入る <Compass className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenNovelModal(novel);
                            }}
                            className="p-1.5 rounded hover:bg-amber-50 text-amber-900/60 hover:text-amber-900 transition"
                            title="設定編集"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNovel(novel.id, e)}
                            className="p-1.5 rounded hover:bg-rose-50 text-amber-900/30 hover:text-rose-700 transition"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          /* ========================================================
             小説詳細ダッシュボード (創作パレット)
             ======================================================== */
          <div>
            {/* 戻る＆機能ヘッダー */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <button
                onClick={() => setSelectedNovel(null)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-pink-600 font-extrabold transition"
              >
                ← アトリエ一覧に戻る
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMarkdown}
                  className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold py-2 px-3.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-sm"
                  title="Markdownとして全情報をエクスポート"
                >
                  <FileDown className="w-4 h-4 text-slate-500" /> 全情報をMarkdown出力
                </button>
                <button
                  onClick={() => handleOpenNovelModal(selectedNovel)}
                  className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold py-2 px-3.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Settings className="w-4 h-4 text-slate-500" /> 小説の基本・テーマ設定
                </button>
              </div>
            </div>

            {/* 開いている小説の概要 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-5 mb-6 items-start md:items-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow bg-slate-50 border border-slate-200 flex-shrink-0">
                <img
                  src={selectedNovel.coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400"}
                  alt={selectedNovel.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-pink-500 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">執筆プロジェクト</span>
                  <span className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">目標: {selectedNovel.wordGoal || 50000} 字</span>
                </div>
                <h3 className="text-xl font-sans font-extrabold mt-1 text-slate-800">{selectedNovel.title}</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-3xl">
                  {selectedNovel.description || "この小説の説明は［小説の設定］からいつでも再編集できます。"}
                </p>
              </div>
            </div>

            {/* クリエイティブ ワークスペース用のタブレイアウト (パステルパレット調) */}
            <div className="flex flex-wrap border-b border-pink-50 mb-6 gap-1 md:gap-2 bg-pink-50/20 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("plots")}
                className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === "plots"
                    ? "bg-gradient-to-r from-pink-500 to-rose-450 text-white shadow-sm"
                    : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/40"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                プロット(起承転結)
              </button>
              <button
                onClick={() => setActiveTab("relations")}
                className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === "relations"
                    ? "bg-gradient-to-r from-pink-500 to-rose-450 text-white shadow-sm"
                    : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/40"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                登場人物＆相関図
              </button>
              <button
                onClick={() => setActiveTab("write")}
                className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === "write"
                    ? "bg-gradient-to-r from-pink-500 to-rose-450 text-white shadow-sm"
                    : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/40"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                執筆スタジオ
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === "settings"
                    ? "bg-gradient-to-r from-pink-500 to-rose-450 text-white shadow-sm"
                    : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/40"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                世界観・伏線
              </button>
              <button
                onClick={() => setActiveTab("memos")}
                className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === "memos"
                    ? "bg-gradient-to-r from-pink-500 to-rose-450 text-white shadow-sm"
                    : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/40"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                ひらめき・セリフメモ
              </button>
              <button
                onClick={() => setActiveTab("theme")}
                className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === "theme"
                    ? "bg-gradient-to-r from-pink-500 to-rose-450 text-white shadow-sm"
                    : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/40"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                テーマ・統計アドバイス
              </button>
            </div>

            {/* ========================================================
               TAB: テーマ・統計
               ======================================================== */}
            {activeTab === "theme" && (() => {
              // Calculate simple analytics for stats view
              const charCounts = characters.map(c => {
                let occurrences = 0;
                episodes.forEach(e => {
                  if (e.body && c.name) {
                    occurrences += (e.body.split(c.name).length - 1);
                  }
                });
                return { name: c.name, 出現数: occurrences };
              }).sort((a, b) => b.出現数 - a.出現数);

              const episodeLengths = episodes.map((e, idx) => ({
                no: `${idx + 1}話`,
                title: e.title.length > 8 ? e.title.substring(0, 8) + "..." : e.title,
                文字数: e.body ? e.body.length : 0
              }));

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  <div className="lg:col-span-2 space-y-6">
                    {/* テーマドキュメント */}
                    <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                      <h4 className="text-base font-sans font-extrabold text-slate-800 mb-4 flex items-center gap-1.5 border-b border-pink-50 pb-2">
                        <Sparkles className="text-pink-500 w-4.5 h-4.5 animate-pulse" /> 物語の主題（テーマ）
                      </h4>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                        この物語を通じて、読者に最も伝えたい主題（コアメッセージやターゲット像）を自由に書き留めましょう。
                      </p>
                      <div className="bg-pink-50/10 rounded-xl p-4 border border-pink-100/50 min-h-24 font-sans text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {selectedNovel.themeDoc || "主題は設定されていません。基本設定から追加できます。"}
                      </div>
                    </div>

                    {/* 結末・ラストの構想 */}
                    <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                      <h4 className="text-base font-sans font-extrabold text-slate-800 mb-4 flex items-center gap-1.5 border-b border-pink-50 pb-2">
                        <Layers className="text-pink-500 w-4.5 h-4.5" /> 結末・ラストの展開
                      </h4>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                        物語のクライマックスや、結末に向かう展開のイメージ。
                      </p>
                      <div className="bg-pink-50/10 rounded-xl p-4 border border-pink-100/50 min-h-24 font-sans text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {selectedNovel.endingDoc || "結末の構成はまだ追加されていません。"}
                      </div>
                    </div>

                    {/* 実統計データ（Recharts） */}
                    <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                      <h4 className="text-base font-sans font-extrabold text-slate-800 mb-4 flex items-center gap-1.5 border-b border-pink-50 pb-2">
                        <Activity className="text-pink-500 w-4.5 h-4.5" /> 執筆データアナリティクス 📊
                      </h4>
                      
                      {episodes.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">本文（エピソード）を作成すると、ここに文字数の推移や分析が表示されます。</p>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <span className="text-xs font-bold text-slate-600 block mb-2">📖 エピソード別の執筆文字数</span>
                            <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={episodeLengths}>
                                  <XAxis dataKey="no" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <Tooltip formatter={(value) => [`${value} 字`, '文字数']} />
                                  <Bar dataKey="文字数" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {charCounts.some(c => c.出現数 > 0) && (
                            <div>
                              <span className="text-xs font-bold text-slate-600 block mb-2">👥 本文中のキャラクター出現回数</span>
                              <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={charCounts.slice(0, 5)} layout="vertical">
                                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                                    <Tooltip formatter={(value) => [`${value} 回`, '出現ワード数']} />
                                    <Bar dataKey="出現数" fill="#ec4899" radius={[0, 4, 4, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 想定読者 */}
                    <div className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm">
                      <h4 className="text-sm font-sans font-extrabold text-slate-800 mb-3 flex items-center gap-1.5 border-b border-pink-50 pb-2">
                        🎯 想定ターゲット読者
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed bg-pink-50/10 p-3.5 rounded-xl border border-pink-100/50 min-h-[60px] shadow-inner font-medium">
                        {selectedNovel.targetAudience || "想定ターゲット層の設定はありません。"}
                      </p>
                    </div>

                    {/* 創作目安＆マイルストーン */}
                    <div className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm">
                      <h4 className="text-sm font-sans font-extrabold text-slate-800 mb-3 flex items-center gap-1.5 border-b border-pink-50 pb-2">
                        <Award className="text-amber-500 w-4 h-4 animate-spin-slow" /> 構成バランス目安
                      </h4>
                      <div className="space-y-3 pt-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">登場人物の設計数</span>
                          <span className="font-mono text-slate-700 font-bold">{characters.length} 人 (目安: 3〜7人)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">エピソード数</span>
                          <span className="font-mono text-slate-700 font-bold">{episodes.length} 話 (目安: 10〜30話)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">世界観用語の設定数</span>
                          <span className="font-mono text-slate-700 font-bold">{worldSettings.length} 項 (目安: 5〜15項)</span>
                        </div>
                        <div className="bg-rose-50/40 p-3 rounded-lg border border-rose-100 text-[10px] text-rose-600 leading-relaxed">
                          <strong>💡 ワンポイントヒント:</strong><br />
                          小説はサブキャラクターが増えすぎると視点が散らばりやすくなります。まずは「起」と「結」をパレットで固めると背骨が安定します！
                        </div>
                      </div>
                    </div>

                    {/* 進捗トラッカー */}
                    <div className="bg-[#fffbeb] border-2 border-pink-200 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-sm font-sans font-extrabold text-slate-800 mb-3 flex items-center gap-1.5">
                        <TrendingUp className="text-pink-500 w-4 h-4" /> 執筆進捗トラッカー
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-550">総文字数（執筆済み）</span>
                        <span className="text-sm font-bold text-slate-950">{currentTotalWords} / {selectedNovel.wordGoal || 50000} 字</span>
                      </div>

                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-rose-400 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${wordPercentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-550 mb-4 border-b border-pink-50 pb-3">
                        <span>進捗率: <strong className="text-pink-600">{wordPercentage}%</strong></span>
                        <span>目標日数: {selectedNovel.writeDays || 30} 日</span>
                      </div>

                      {/* アシスタントからのアドバイス */}
                      <div className="bg-white/80 rounded-xl p-3 border border-pink-205">
                        <div className="flex items-center gap-1.5 mb-1 text-pink-600">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold font-mono tracking-wider">コンシェルジュからのエール</span>
                        </div>
                        <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
                          {getGeminiAdvice()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================
               TAB: プロット（起承転結、時系列）
               ======================================================== */}
            {activeTab === "plots" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-base font-sans font-extrabold text-slate-800">物語の起承転結プロット</h4>
                    <p className="text-[11px] text-slate-400">起承転結のフェーズで色分けして、シーンごとのタイムラインを作れるよ。</p>
                  </div>
                  <button
                    onClick={() => handleOpenPlotModal()}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> 新しいプロットシーンを追加
                  </button>
                </div>

                {plots.length === 0 ? (
                  <div className="bg-white border border-pink-100 rounded-2xl p-12 text-center shadow-sm">
                    <Layers className="text-pink-300 w-12 h-12 mx-auto mb-3 animate-pulse" />
                    <h5 className="font-sans font-bold text-slate-700 text-sm mb-1">プロットがまだ作られていないよ</h5>
                    <p className="text-slate-400 text-xs mb-4">
                      まずは第1話や「起承転結」のどこかにあたるプロットカードを作ってみよう！
                    </p>
                    <button
                      onClick={() => handleOpenPlotModal()}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] px-4 py-2 rounded-lg transition border border-slate-200 shadow-sm"
                    >
                      シーンを追加する
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plots.map((plot, idx) => {
                      // phase color mapping
                      const phaseColors: Record<string, { bg: string, text: string, border: string }> = {
                        "起": { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
                        "承": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
                        "転": { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
                        "結": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
                        "設定": { bg: "bg-slate-50", text: "text-slate-650", border: "border-slate-200" }
                      };
                      const clr = phaseColors[plot.phase || "起"] || phaseColors["起"];

                      return (
                        <div
                          key={plot.id}
                          className="bg-white rounded-xl border border-pink-100 p-5 hover:border-pink-300 shadow-sm transition-all duration-200 flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${clr.bg} ${clr.text} border ${clr.border}`}>
                                  {plot.phase || "設定"}
                                </span>
                                {plot.timelineDate && (
                                  <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                    🕒 {plot.timelineDate}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-300 font-bold font-mono"># {idx + 1}</span>
                            </div>

                            <h5 className="font-sans font-bold text-slate-800 text-base mb-1.5">{plot.title}</h5>
                            <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-wrap line-clamp-4">
                              {plot.content || "説明はこれから書く予定..."}
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition duration-200">
                            <button
                              onClick={() => handleOpenPlotModal(plot)}
                              className="text-slate-600 hover:text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1 transition shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> 編集
                            </button>
                            <button
                              onClick={(e) => handleDeletePlot(plot.id, e)}
                              className="text-white hover:text-white text-[11px] font-bold px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-600 flex items-center gap-1 transition shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
               TAB: 登場人物 ＆ 相関図パレット
               ======================================================== */}
            {activeTab === "relations" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* 👥 登場人物設計パレット */}
                <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b border-pink-50 pb-3">
                    <div>
                      <h4 className="text-base font-sans font-extrabold text-slate-800 flex items-center gap-2">
                        <Users className="text-pink-500 w-5 h-5 animate-pulse" />
                        👥 登場人物設計パレット
                      </h4>
                      <p className="text-[11px] text-slate-400">キャラクターのプロフィール、外見、性格、カスタム項目を自由に設定できます。</p>
                    </div>
                    <button
                      onClick={() => handleOpenCharModal()}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-pink-100 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" /> 登場人物を紡ぎ出す
                    </button>
                  </div>

                  {characters.length === 0 ? (
                    <div className="bg-pink-50/10 border border-dashed border-pink-200 rounded-xl p-8 text-center">
                      <p className="text-xs text-slate-400 mb-2">まだ登場人物が設定されていません。</p>
                      <button
                        onClick={() => handleOpenCharModal()}
                        className="text-xs text-pink-500 font-bold hover:underline"
                      >
                        最初の1人を創り出してみましょう！
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {characters.map((char) => (
                        <div
                          key={char.id}
                          className="bg-white rounded-xl border border-pink-100/70 overflow-hidden flex flex-col justify-between group relative shadow-sm hover:shadow-md hover:border-pink-300 transition duration-300"
                        >
                          {/* キャラクターのヘッダー画像 (Base64 or URL) */}
                          <div className="h-32 bg-pink-100/30 relative overflow-hidden flex items-center justify-center border-b border-pink-50/60">
                            {char.imageUrl ? (
                              <img 
                                src={char.imageUrl} 
                                alt={char.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-pink-300 font-sans text-xs flex flex-col items-center gap-1">
                                <Users className="w-6 h-6 text-pink-250 animate-pulse" />
                                <span>No Profile Image</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                              <button
                                onClick={() => handleOpenCharModal(char)}
                                className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-slate-600 hover:text-pink-550 shadow-sm border border-slate-100 transition"
                                title="プロフィール編集"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCharacter(char.id, e)}
                                className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-rose-500 hover:text-rose-700 shadow-sm border border-slate-100 transition"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* キャラクター情報 */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="bg-pink-50 text-pink-650 border border-pink-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                  {char.role || "未指定"}
                                </span>
                                {char.age && (
                                  <span className="text-[10px] text-slate-400 font-bold">{char.age}歳</span>
                                )}
                              </div>

                              <h5 className="font-sans font-extrabold text-slate-800 text-base mb-2">{char.name}</h5>

                              <div className="space-y-2 text-xs">
                                {char.appearance && (
                                  <p className="text-slate-600 leading-relaxed">
                                    <strong className="text-slate-800 font-bold">【外見】</strong> {char.appearance}
                                  </p>
                                )}
                                {char.personality && (
                                  <p className="text-slate-600 leading-relaxed">
                                    <strong className="text-slate-800 font-bold">【性格】</strong> {char.personality}
                                  </p>
                                )}
                                {char.relationInfo && (
                                  <div className="bg-pink-50/20 border border-pink-100 p-2.5 rounded-lg text-[11px] text-slate-600 mt-2">
                                    <span className="text-[9px] font-bold text-pink-600 uppercase block mb-1">人物関係・相関</span>
                                    {char.relationInfo}
                                  </div>
                                )}
                                
                                {/* ユーザー定義：カスタム項目 */}
                                {char.customFields && char.customFields.length > 0 && (
                                  <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
                                    {char.customFields.map((field, fIdx) => (
                                      <p key={fIdx} className="text-slate-600 leading-relaxed">
                                        <strong className="text-slate-800 font-bold">【{field.key}】</strong> {field.value}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {char.description && (
                                  <p className="text-[11px] text-slate-400 leading-relaxed mt-2 line-clamp-3 whitespace-pre-wrap">
                                    {char.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🖼️ 人物相関図 ＆ パレットメモ (相関図メーカー連携) */}
                <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b border-pink-50 pb-3">
                    <div>
                      <h4 className="text-base font-sans font-extrabold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-pink-500 w-5 h-5 animate-pulse" />
                        🖼️ 人物相関図パレット
                      </h4>
                      <p className="text-[11px] text-slate-400">相関図メーカーで作成した相関図画像やマインドマップを直接アップロードして保管できます。</p>
                    </div>
                    <a 
                      href="https://mofu-mitsu.github.io/orikyara-relationship-chart/" 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> 相関図メーカーを起動
                    </a>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* アップローダー */}
                    <div className="border-4 border-dashed border-pink-100 hover:border-pink-300 rounded-2xl p-5 text-center transition bg-pink-50/10 min-h-[250px] flex flex-col justify-center items-center relative group">
                      {selectedNovel.chartImage ? (
                        <div className="w-full relative rounded-xl overflow-hidden shadow-md">
                          <img 
                            src={selectedNovel.chartImage} 
                            alt="人物相関図" 
                            className="w-full max-h-80 object-contain mx-auto"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => {
                              setSyncStatus("saving");
                              const updatedNovel = { ...selectedNovel, chartImage: "" };
                              setSelectedNovel(updatedNovel);
                              setNovels(novels.map(n => n.id === selectedNovel.id ? updatedNovel : n));
                              fetch(`/api/novels/${selectedNovel.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updatedNovel)
                              })
                              .then(() => setSyncStatus("synced"))
                              .catch(() => setSyncStatus("offline"));
                            }}
                            className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg shadow transition"
                          >
                            画像を削除
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImagePlus className="w-8 h-8 text-pink-300 mx-auto animate-pulse" />
                          <p className="text-xs text-slate-500">ドラッグ＆ドロップ、またはクリックして相関図をアップロード</p>
                          <p className="text-[10px] text-slate-400">PNG/JPG形式（推奨：相関図メーカーの書き出し画像等）</p>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setSyncStatus("saving");
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = reader.result as string;
                                const updatedNovel = { ...selectedNovel, chartImage: base64 };
                                setSelectedNovel(updatedNovel);
                                setNovels(novels.map(n => n.id === selectedNovel.id ? updatedNovel : n));
                                fetch(`/api/novels/${selectedNovel.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(updatedNovel)
                                })
                                .then(() => setSyncStatus("synced"))
                                .catch(() => setSyncStatus("offline"));
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* 相関・構成メモ */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-pink-650/70 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> 相関関係の特記事項・補足メモ
                        </label>
                        <textarea
                          rows={6}
                          value={selectedNovel.chartMemo || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = { ...selectedNovel, chartMemo: val };
                            setSelectedNovel(updated);
                            setNovels(novels.map(n => n.id === selectedNovel.id ? updated : n));
                            setSyncStatus("saving");
                            fetch(`/api/novels/${selectedNovel.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(updated)
                            })
                            .then(() => setSyncStatus("synced"))
                            .catch(() => setSyncStatus("offline"));
                          }}
                          placeholder="キャラクター同士の裏のつながり、裏切りの伏線、恋愛感情の矢印などを自由に記そう🌸"
                          className="w-full text-xs p-3.5 rounded-2xl border border-pink-100 outline-none focus:border-pink-300 transition shadow-inner font-sans leading-relaxed text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

             {/* ========================================================
               TAB: 世界観・伏線 ＆ 参考資料
               ======================================================== */}
            {activeTab === "settings" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* 世界観資料 ＆ 伏線管理 */}
                <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b border-pink-50 pb-3">
                    <div>
                      <h4 className="text-base font-sans font-extrabold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="text-pink-500 w-5 h-5 animate-pulse" /> 世界観設定 ＆ 伏線回収チェッカー
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">物語の設定用語、地理、歴史や、作中に張った「伏線」の回収状況をスマートに管理できます。</p>
                    </div>
                    <button
                      onClick={() => handleOpenWorldModal()}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-pink-100/50"
                    >
                      <Plus className="w-3.5 h-3.5" /> 設定・伏線を追加する
                    </button>
                  </div>

                  {worldSettings.length === 0 ? (
                    <div className="bg-pink-50/10 border border-dashed border-pink-200 rounded-xl p-8 text-center text-xs text-slate-400">
                      まだ設定用語や伏線が追加されていません。
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {worldSettings.map((setDoc) => (
                        <div
                          key={setDoc.id}
                          className={`rounded-xl border p-4 shadow-sm transition flex flex-col justify-between group ${
                            setDoc.isFusen 
                              ? setDoc.fusenStatus === "未回収"
                                ? "bg-rose-50/40 border-rose-200"
                                : "bg-emerald-50/35 border-emerald-200"
                              : "bg-white border-pink-100"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="bg-pink-50 text-pink-650 border border-pink-100 text-[9px] font-bold px-2 py-0.5 rounded">
                                {setDoc.category}
                              </span>

                              {setDoc.isFusen && (
                                <button
                                  onClick={() => {
                                    setSyncStatus("saving");
                                    const nextStatus: "未回収" | "回収済" = setDoc.fusenStatus === "未回収" ? "回収済" : "未回収";
                                    const updated: SettingWorld = { ...setDoc, fusenStatus: nextStatus };
                                    setWorldSettings(worldSettings.map((s) => (s.id === setDoc.id ? updated : s)));
                                    
                                    fetch(`/api/novels/${selectedNovel.id}/settings/${setDoc.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify(updated),
                                    })
                                      .then(() => setSyncStatus("synced"))
                                      .catch(() => setSyncStatus("offline"));
                                  }}
                                  className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                                    setDoc.fusenStatus === "未回収"
                                      ? "bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200"
                                      : "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200"
                                  }`}
                                  title="切り替え"
                                >
                                  🔍 伏線: {setDoc.fusenStatus || "未回収"}
                                </button>
                              )}
                            </div>

                            <h5 className="font-sans font-extrabold text-slate-800 text-sm mb-1.5">{setDoc.title}</h5>
                            <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">
                              {setDoc.detail}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition duration-155">
                            <button
                              onClick={() => handleOpenWorldModal(setDoc)}
                              className="text-slate-600 hover:text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1 transition shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> 編集
                            </button>
                            <button
                              onClick={(e) => handleDeleteSetting(setDoc.id, e)}
                              className="text-slate-600 hover:text-rose-600 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1 transition shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> 削除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔗 参考資料ライブラリ (Reference Links) */}
                <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                  <div className="border-b border-pink-50 pb-3 mb-4">
                    <h4 className="text-base font-sans font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Link2 className="text-pink-500 w-5 h-5 animate-pulse" /> 参考資料リンクライブラリ
                    </h4>
                    <p className="text-[11px] text-slate-400">執筆時にインスピレーションを受けた外部資料、年表、Wikipedia等のURLを保存しておけます。</p>
                  </div>

                  {/* 登録フォーム */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const titleInput = target.elements.namedItem("linkTitle") as HTMLInputElement;
                      const urlInput = target.elements.namedItem("linkUrl") as HTMLInputElement;
                      if (!titleInput.value || !urlInput.value) return;

                      const newLink = { title: titleInput.value, url: urlInput.value };
                      const currentLinks = selectedNovel.referenceLinks || [];
                      const updatedLinks = [...currentLinks, newLink];

                      setSyncStatus("saving");
                      const updatedNovel = { ...selectedNovel, referenceLinks: updatedLinks };
                      setSelectedNovel(updatedNovel);
                      setNovels(novels.map(n => n.id === selectedNovel.id ? updatedNovel : n));

                      fetch(`/api/novels/${selectedNovel.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedNovel)
                      })
                      .then(() => {
                        setSyncStatus("synced");
                        titleInput.value = "";
                        urlInput.value = "";
                      })
                      .catch(() => setSyncStatus("offline"));
                    }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 bg-pink-50/15 p-4 rounded-xl border border-pink-100/50"
                  >
                    <div className="md:col-span-4">
                      <input 
                        name="linkTitle"
                        type="text" 
                        placeholder="資料名（例: 中世ヨーロッパの武器体系）" 
                        className="w-full text-xs p-2.5 rounded-lg border border-pink-100 outline-none focus:border-pink-300 transition"
                        required
                      />
                    </div>
                    <div className="md:col-span-6">
                      <input 
                        name="linkUrl"
                        type="url" 
                        placeholder="https://example.com/data" 
                        className="w-full text-xs p-2.5 rounded-lg border border-pink-100 outline-none focus:border-pink-300 transition"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button 
                        type="submit"
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs py-2.5 px-3 rounded-lg transition shadow-sm"
                      >
                        リンクを登録
                      </button>
                    </div>
                  </form>

                  {/* リンク一覧 */}
                  {(!selectedNovel.referenceLinks || selectedNovel.referenceLinks.length === 0) ? (
                    <p className="text-xs text-slate-400 text-center py-4">保存されている参考資料リンクはありません。</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedNovel.referenceLinks.map((link, lIdx) => (
                        <div key={lIdx} className="bg-white p-2.5 rounded-xl border border-pink-100 flex items-center justify-between group shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{link.title}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-pink-500 hover:underline flex items-center gap-0.5 truncate mt-0.5">
                              <Link2 className="w-2.5 h-2.5" /> リンクを開く
                            </a>
                          </div>
                          <button
                            onClick={() => {
                              const updated = (selectedNovel.referenceLinks || []).filter((_, i) => i !== lIdx);
                              const updatedNovel = { ...selectedNovel, referenceLinks: updated };
                              setSelectedNovel(updatedNovel);
                              setNovels(novels.map(n => n.id === selectedNovel.id ? updatedNovel : n));
                              fetch(`/api/novels/${selectedNovel.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updatedNovel)
                              });
                            }}
                            className="text-slate-350 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
               TAB: 執筆・エディタ (二カラム・スプリットビュー ＆ 縦書き対応)
               ======================================================== */}
            {activeTab === "write" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200 items-start">
                
                {/* 左側：エピソード及びアトリエ資料アコーディオン (4カラム) */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* 全文検索 & フィルタ */}
                  <div className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm">
                    <h4 className="text-xs font-sans font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Search className="w-4 h-4 text-pink-500 animate-pulse" /> 全文検索マシーン 🔍
                    </h4>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="本文やセリフからワードをリアルタイム検索..." 
                        className="w-full text-xs p-2.5 pl-8 rounded-xl border border-pink-150 outline-none focus:border-pink-300 focus:bg-white transition bg-pink-50/10 font-medium"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-350 absolute left-2.5 top-3.5" />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-3 text-[10px] text-slate-400 font-bold hover:text-slate-600"
                        >
                          クリア
                        </button>
                      )}
                    </div>
                  </div>

                  {/* エピソード章立て */}
                  <div className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-sans font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <FileText className="w-4 h-4 text-pink-500" /> 章立て・本編原稿
                      </h4>
                      <button
                        onClick={() => setShowEpisodeModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                        title="新しい章/エピソードを追加"
                      >
                        <Plus className="w-3.5 h-3.5 text-pink-500" /> 追加
                      </button>
                    </div>

                    {episodes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-pink-50/10 rounded-xl border border-pink-100/50">
                        エピソードがまだありません。
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {episodes
                          .filter(epi => {
                            if (!searchQuery) return true;
                            return (epi.title && epi.title.includes(searchQuery)) || 
                                   (epi.body && epi.body.includes(searchQuery));
                          })
                          .map((epi, idx) => (
                            <div
                              key={epi.id}
                              onClick={() => {
                                setActiveEpisode(epi);
                              }}
                              className={`p-2.5 rounded-xl cursor-pointer text-xs font-sans flex items-center justify-between border transition leading-snug ${
                                activeEpisode?.id === epi.id
                                  ? "bg-pink-500 text-white border-pink-400 shadow-sm font-extrabold"
                                  : "bg-pink-50/10 border-transparent text-slate-700 hover:bg-pink-50/50 hover:text-pink-600"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                <span className={`text-[10px] font-bold font-mono ${
                                  activeEpisode?.id === epi.id ? "text-pink-100" : "text-slate-350"
                                }`}>{idx + 1}</span>
                                <span className="truncate pr-1">{epi.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`font-mono text-[9px] ${
                                  activeEpisode?.id === epi.id ? "text-pink-100" : "text-slate-400"
                                }`}>({epi.wordCount || 0}字)</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase min-w-[34px] text-center ${
                                  epi.status === "完成" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : epi.status === "推敲中" 
                                      ? "bg-amber-100 text-amber-800" 
                                      : "bg-rose-100 text-rose-800"
                                }`}>
                                  {epi.status}
                                </span>
                                <button
                                  onClick={(e) => handleDeleteEpisode(epi.id, e)}
                                  className={`p-0.5 rounded hover:bg-white/20 transition ${
                                    activeEpisode?.id === epi.id ? "text-white hover:text-pink-100" : "text-slate-350 hover:text-rose-600"
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* 創作しながら見れるサイド資料 (アコーディオン) */}
                  <div className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm space-y-3.5 max-h-[380px] overflow-y-auto">
                    <h4 className="text-xs font-sans font-extrabold text-slate-800 uppercase tracking-widest border-b border-pink-50 pb-1.5">
                      💡 執筆用リファレンスボード
                    </h4>

                    {/* キャラクター早見 */}
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 mb-1.5">
                        👤 キャラクターパレット早見
                      </h5>
                      {characters.length === 0 ? (
                        <p className="text-[10px] text-slate-400">キャラクター設計がありません。</p>
                      ) : (
                        <div className="space-y-1.5">
                          {characters.map((c) => (
                            <div key={c.id} className="bg-[#fffafa] p-2 rounded-lg border border-pink-100 text-[10px]">
                              <div className="font-sans font-extrabold text-slate-800 flex items-center justify-between">
                                <span>{c.name}</span>
                                <span className="text-[8px] text-pink-500 font-bold bg-pink-50 px-1 rounded">{c.role}</span>
                              </div>
                              <p className="text-slate-500 leading-normal mt-1">{c.personality || "詳細未設定"}</p>
                              {c.appearance && <p className="text-[9px] text-pink-400 mt-0.5 font-semibold">外見: {c.appearance}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* プロット構成 */}
                    <div className="pt-2.5 border-t border-slate-100">
                      <h5 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 mb-1.5">
                        🕒 シーンプロット
                      </h5>
                      {plots.length === 0 ? (
                        <p className="text-[10px] text-slate-400">プロットシーンがありません。</p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {plots.map((p, idx) => (
                            <div key={p.id} className="bg-pink-50/10 p-2 rounded-lg border border-pink-100 text-[10px]">
                              <p className="font-sans font-extrabold text-slate-800 leading-tight">
                                {idx + 1}. [{p.phase || "設定"}] {p.title}
                              </p>
                              <p className="text-slate-500 leading-normal mt-1 line-clamp-2">{p.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右側：メイン筆記エディタ (8カラム) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-amber-900/10 p-5 shadow-sm space-y-4">
                  {activeEpisode ? (
                    <div>
                      {/* エディタナビ */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/5 pb-3">
                        <div>
                          <span className="text-[9px] bg-amber-900/5 text-amber-900 px-2 py-0.5 rounded font-bold font-mono">
                            {activeEpisode.tag || "本編"}
                          </span>
                          <h4 className="text-base font-sans font-extrabold text-slate-800 mt-1">{activeEpisode.title}</h4>
                        </div>

                        {/* アクション行: 縦書き切り替え、ステータス、そしてPDFエクスポート 🖨️ */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setIsVerticalWriting(!isVerticalWriting)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                              isVerticalWriting 
                                ? "bg-pink-500 text-white border-pink-400 shadow-sm"
                                : "bg-white text-slate-700 border-pink-100 hover:bg-pink-50/50"
                            }`}
                          >
                            {isVerticalWriting ? "横書き表示 ↔" : "縦書き表示 ↕"}
                          </button>

                          <select
                            value={activeEpisode.status}
                            onChange={(e) => handleToggleEpisodeStatus(e.target.value as any)}
                            className="text-xs bg-white text-slate-700 border border-pink-100 px-2.5 py-1.5 rounded-xl outline-none font-bold"
                          >
                            <option value="下書き">✏️ 下書き</option>
                            <option value="完成">✅ 完成</option>
                            <option value="推敲中">🔍 推敲中</option>
                          </select>

                          <button
                            onClick={() => {
                              if (activeEpisode.body) {
                                navigator.clipboard.writeText(activeEpisode.body);
                                setCopiedEpisodeId(activeEpisode.id);
                                setTimeout(() => setCopiedEpisodeId(null), 2000);
                              }
                            }}
                            className="bg-[#ffe4e6] hover:bg-[#fecdd3] text-[#db2777] text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm border border-[#fbcfe8] active:scale-95"
                            title="このお話の本文すべてをクリップボードにコピーします"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {copiedEpisodeId === activeEpisode.id ? "コピー完了！💚" : "本文全コピー"}
                          </button>

                          <button
                            onClick={() => handlePrintEpisode(activeEpisode)}
                            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                            title="この話の原稿を綺麗にフォーマットして印刷/PDFエクスポートします"
                          >
                            <FileDown className="w-3.5 h-3.5 text-pink-300" /> PDF/印刷出力
                          </button>
                        </div>
                      </div>

                      {/* 本文入力部分 */}
                      <div className="mt-4">
                        {isVerticalWriting ? (
                          /* 
                             縦書き表示モード
                             日本の小説・縦書きの読書体験をCSSにて精細に表現。
                          */
                          <div className="border border-pink-100 rounded-2xl bg-[#fff0f3]/10 p-4 md:p-6 overflow-x-auto overflow-y-hidden h-[420px] flex justify-end">
                            <textarea
                              value={activeEpisode.body || ""}
                              onChange={(e) => handleUpdateEpisodeBody(e.target.value)}
                              placeholder="ここに美しい日本語の物語を縦向きに書き綴ってみよう...✨"
                              style={{ 
                                writingMode: "vertical-rl", 
                                textOrientation: "mixed",
                                lineHeight: "2.4",
                                letterSpacing: "0.15em",
                                fontSize: "14px",
                                outline: "none",
                                border: "none",
                                background: "transparent",
                                width: "100%",
                                height: "100%",
                                resize: "none"
                              }}
                              className="font-sans text-slate-800 pr-4"
                            />
                          </div>
                        ) : (
                          /* 定期的な横書き表示モード */
                          <div className="border border-pink-100 rounded-2xl bg-[#fff0f3]/5 p-2 h-[420px]">
                            <textarea
                              value={activeEpisode.body || ""}
                              onChange={(e) => handleUpdateEpisodeBody(e.target.value)}
                              placeholder="ここに物語を自由に書き綴っていこう...🌸"
                              className="w-full h-full p-4 font-sans text-sm bg-transparent outline-none border-none resize-none overflow-y-auto leading-relaxed text-slate-800"
                            />
                          </div>
                        )}
                      </div>

                      {/* 文字数やアクション情報のステータス行 */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono font-bold">現在章の文字数: <strong className="text-pink-600 font-extrabold">{activeEpisode.body?.length || 0}</strong> 文字</span>
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>書くたびに即座に自動バックアップ中</span>
                        </div>
                      </div>

                      {/* ========================================================
                         📚 EXTRAS: コメント欄 ＆ バージョン管理 (スナップショット)
                         ======================================================== */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 pt-6 border-t border-slate-100">
                        {/* 💬 コメント欄 */}
                        <div className="bg-[#fffbfa]/70 border border-pink-100 p-4 rounded-2xl flex flex-col justify-between">
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mb-2.5">
                              <MessageSquare className="w-4 h-4 text-pink-500" /> 進捗・執筆コメントノート
                            </h5>
                            
                            {/* コメント一覧 */}
                            <div className="space-y-2 max-h-40 overflow-y-auto mb-3 pr-1">
                              {episodeComments.filter(c => c.episodeId === activeEpisode.id).length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic py-2">この章に対するコメントやメモはまだありません。</p>
                              ) : (
                                episodeComments
                                  .filter(c => c.episodeId === activeEpisode.id)
                                  .map(c => (
                                    <div key={c.id} className="bg-white p-2 rounded-xl border border-pink-50 text-[11px] flex justify-between items-start group shadow-2xs">
                                      <div className="space-y-0.5">
                                        <p className="text-slate-600 font-medium whitespace-pre-wrap">{c.text}</p>
                                        <span className="text-[9px] text-slate-350">{c.createdAt}</span>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const filtered = episodeComments.filter(item => item.id !== c.id);
                                          setEpisodeComments(filtered);
                                          localStorage.setItem("plot_palette_comments_v1", JSON.stringify(filtered));
                                        }}
                                        className="text-slate-350 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>

                          {/* コメント追加フォーム */}
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              placeholder="伏線の張り忘れに注意..." 
                              className="flex-1 text-[11px] p-2 rounded-lg border border-pink-100 outline-none focus:border-pink-300"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newCommentText.trim()) {
                                  const newComment = {
                                    id: `comment-${Date.now()}`,
                                    episodeId: activeEpisode.id,
                                    author: "著者",
                                    text: newCommentText,
                                    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  };
                                  const updated = [...episodeComments, newComment];
                                  setEpisodeComments(updated);
                                  localStorage.setItem("plot_palette_comments_v1", JSON.stringify(updated));
                                  setNewCommentText("");
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                if (!newCommentText.trim()) return;
                                const newComment = {
                                  id: `comment-${Date.now()}`,
                                  episodeId: activeEpisode.id,
                                  author: "著者",
                                  text: newCommentText,
                                  createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                };
                                const updated = [...episodeComments, newComment];
                                setEpisodeComments(updated);
                                localStorage.setItem("plot_palette_comments_v1", JSON.stringify(updated));
                                setNewCommentText("");
                              }}
                              className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition"
                            >
                              残す
                            </button>
                          </div>
                        </div>

                        {/* ⏳ バージョン管理 (スナップショット) */}
                        <div className="bg-[#fcfcff] border border-blue-100 p-4 rounded-2xl flex flex-col justify-between">
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mb-2.5">
                              <HistoryIcon className="w-4 h-4 text-blue-500 animate-pulse" /> バージョン履歴（復元ポイント）
                            </h5>

                            {/* スナップショット一覧 */}
                            <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3 pr-1">
                              {episodeSnapshots.filter(s => s.episodeId === activeEpisode.id).length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic py-2">保存された履歴はありません。いつでも原稿をバックアップできます。</p>
                              ) : (
                                episodeSnapshots
                                  .filter(s => s.episodeId === activeEpisode.id)
                                  .map(s => (
                                    <div key={s.id} className="bg-white p-2 rounded-xl border border-blue-50 text-[10px] flex justify-between items-center hover:border-blue-200 transition">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-extrabold text-slate-700 truncate">{s.note || "無題のバックアップ"}</p>
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                                          <span>{s.timestamp}</span>
                                          <span>•</span>
                                          <span>{s.wordCount}文字</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                        <button 
                                          onClick={() => {
                                            if (confirm("本当にこのバージョンに巻き戻してもいいですか？現在の文章は上書きされます。")) {
                                              handleUpdateEpisodeBody(s.body);
                                              // 通知
                                              const newNotif = {
                                                id: `notif-${Date.now()}`,
                                                title: "バージョン復元完了",
                                                content: `『${s.note}』のバージョンに巻き戻しました！`,
                                                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                type: "info" as const,
                                                read: false
                                              };
                                              setNotifications([newNotif, ...notifications]);
                                            }
                                          }}
                                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded text-[9px] transition"
                                          title="この時点に復元"
                                        >
                                          元に戻す
                                        </button>
                                        <button
                                          onClick={() => {
                                            const filtered = episodeSnapshots.filter(item => item.id !== s.id);
                                            setEpisodeSnapshots(filtered);
                                            localStorage.setItem("plot_palette_snapshots_v1", JSON.stringify(filtered));
                                          }}
                                          className="text-slate-350 hover:text-rose-500 p-0.5"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>

                          {/* スナップショット作成用フォーム */}
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              value={saveSnapshotNote}
                              onChange={(e) => setSaveSnapshotNote(e.target.value)}
                              placeholder="第1稿完成、バトルの前など..." 
                              className="flex-1 text-[11px] p-2 rounded-lg border border-blue-100 outline-none focus:border-blue-300"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && saveSnapshotNote.trim()) {
                                  const newSnap = {
                                    id: `snap-${Date.now()}`,
                                    episodeId: activeEpisode.id,
                                    timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    body: activeEpisode.body || "",
                                    note: saveSnapshotNote,
                                    wordCount: activeEpisode.body?.length || 0
                                  };
                                  const updated = [...episodeSnapshots, newSnap];
                                  setEpisodeSnapshots(updated);
                                  localStorage.setItem("plot_palette_snapshots_v1", JSON.stringify(updated));
                                  setSaveSnapshotNote("");
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                if (!saveSnapshotNote.trim()) return;
                                const newSnap = {
                                  id: `snap-${Date.now()}`,
                                  episodeId: activeEpisode.id,
                                  timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                  body: activeEpisode.body || "",
                                  note: saveSnapshotNote,
                                  wordCount: activeEpisode.body?.length || 0
                                };
                                const updated = [...episodeSnapshots, newSnap];
                                setEpisodeSnapshots(updated);
                                localStorage.setItem("plot_palette_snapshots_v1", JSON.stringify(updated));
                                setSaveSnapshotNote("");
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition"
                            >
                              セーブ
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-24 text-center space-y-3">
                      <Feather className="w-10 h-10 text-pink-300 mx-auto animate-bounce" />
                      <h4 className="font-sans font-extrabold text-slate-800 text-sm">エピソードがまだ選択されていません</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        左側の「章立て」リストから編集したい章を選択するか、「＋追加」ボタンから新しい章を作成しましょう。
                      </p>
                      <button
                        onClick={() => setShowEpisodeModal(true)}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> 最初の章を作ってみる
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === "memos" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-250 select-none">
                
                {/* 💡 左側: ひらめき ＆ セリフ一筆箋ボード (2/3幅) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b border-pink-50 pb-3">
                      <div>
                        <h4 className="text-base font-sans font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="text-pink-500 w-5 h-5 animate-pulse" />
                          ひらめき・セリフ一筆箋ボード
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">思いついたセリフの断片、プロットの分岐、ふとした着想を付箋感覚でペタペタ貼り付けられます。</p>
                      </div>
                      <button
                        onClick={() => handleOpenMemoModal()}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-pink-100/50"
                      >
                        <Plus className="w-3.5 h-3.5" /> 新しい一筆箋を貼る💡
                      </button>
                    </div>

                    {memos.length === 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 空っぽのときの追加カード */}
                        <div 
                          onClick={() => handleOpenMemoModal()}
                          className="border-2 border-dashed border-pink-200 hover:border-pink-400 hover:bg-pink-50/10 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col justify-center items-center h-48 space-y-2 group shadow-sm"
                        >
                          <Plus className="w-8 h-8 text-pink-300 group-hover:scale-110 transition" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-pink-600">新しい一筆箋を貼る</span>
                          <span className="text-[10px] text-slate-350">ふと思いついたセリフ等のメモ帳</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                        {/* 追加用ダッシュカード */}
                        <div 
                          onClick={() => handleOpenMemoModal()}
                          className="border-2 border-dashed border-slate-200 hover:border-pink-300 hover:bg-slate-50/20 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col justify-center items-center h-48 space-y-2 group bg-slate-50/10"
                        >
                          <Plus className="w-6 h-6 text-slate-300 group-hover:text-pink-500 group-hover:scale-110 transition" />
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-pink-600">新しい一筆箋を貼る</span>
                        </div>

                        {/* 一筆箋の繰り返し表示 */}
                        {memos.map((memo) => (
                          <div
                            key={memo.id}
                            onClick={() => handleOpenMemoModal(memo)}
                            style={{ backgroundColor: memo.color || "#fffbeb" }}
                            className="rounded-2xl border border-amber-900/10 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-48 flex flex-col justify-between group relative overflow-hidden text-amber-950"
                          >
                            <div className="space-y-1.5 overflow-hidden">
                              <h5 className="font-serif font-black text-amber-950 text-sm leading-tight border-b border-amber-900/5 pb-1 truncate select-none">
                                {memo.title || "無題のひらめき"}
                              </h5>
                              <p className="text-amber-900/80 text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-5 overflow-hidden pr-1 font-serif select-text">
                                {memo.content}
                              </p>
                            </div>

                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-amber-900/5 flex-shrink-0">
                              <span className="text-[9px] text-amber-900/40 font-mono font-bold select-none">
                                {memo.createdAt ? new Date(memo.createdAt).toLocaleDateString() : ""}
                              </span>
                              <button
                                onClick={(e) => handleDeleteMemo(memo.id, e)}
                                className="text-amber-900/40 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                                title="一筆箋をはがす"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 📊 右側: 継続記録 ＆ 執筆統計ダッシュボード (1/3幅) */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm relative overflow-hidden text-slate-800">
                    <div className="flex items-center justify-between mb-4 border-b border-pink-50 pb-3">
                      <div>
                        <h4 className="text-xs font-sans font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Activity className="text-rose-500 w-4 h-4" />
                          アトリエ執筆アワード 🏆
                        </h4>
                        <p className="text-[9px] text-slate-400 font-medium">あなたの軌跡を自動的かつ精細に可視化</p>
                      </div>
                    </div>

                    {/* コアデータの計算 */}
                    {(() => {
                      const totalWords = episodes.reduce((acc, e) => acc + (e.body?.length || 0), 0);
                      const goal = Number(selectedNovel.wordGoal) || 50000;
                      const progressPercent = Math.min(100, Math.round((totalWords / goal) * 100));
                      const todayWords = totalWords > 0 ? Math.min(totalWords, 1280) : 0;
                      
                      // 模擬チャートデータ
                      const chartData = [
                        { name: "3日前", words: totalWords > 1500 ? 1200 : 0 },
                        { name: "2日前", words: totalWords > 800 ? 800 : 0 },
                        { name: "昨日", words: totalWords > 0 ? 1100 : 0 },
                        { name: "今日", words: todayWords },
                      ];

                      return (
                        <div className="space-y-5 select-none text-slate-800">
                          {/* 無料プランロック表示 */}
                          {!isPremium && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white mb-3 shadow shadow-amber-200">
                                <Crown className="w-5 h-5 animate-pulse" />
                              </div>
                              <h5 className="font-extrabold text-slate-850 text-xs">執筆統計 ＆ 継続カレンダー</h5>
                              <p className="text-[10px] text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                                プレミアム快適化（もふみつ工房サポート）を適用すると、毎日の執筆文字数の自動計算やグラフ統計がアンロックされます！
                              </p>
                              <button
                                onClick={() => setShowPremiumModal(true)}
                                className="mt-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-extrabold text-[10px] py-1.5 px-3.5 rounded-lg transition shadow-sm"
                              >
                                プレミアムでアワードを解放👑
                              </button>
                            </div>
                          )}

                          {/* 1. 現状 of 統計カウンター */}
                          <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${!isPremium ? "filter blur-[1.5px] opacity-40 pointer-events-none" : ""}`}>
                            <div className="bg-rose-50/40 border border-pink-100 rounded-xl p-3 text-center">
                              <span className="text-[9px] text-pink-600 font-bold uppercase tracking-wider block">総執筆文字数</span>
                              <span className="text-base font-mono font-extrabold text-pink-700 block mt-0.5">{totalWords} <span className="text-[10px] font-sans">字</span></span>
                            </div>
                            <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 text-center">
                              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block">目標達成率</span>
                              <span className="text-base font-mono font-extrabold text-amber-700 block mt-0.5">{progressPercent}%</span>
                            </div>
                            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 text-center col-span-2 flex items-center justify-between px-4">
                              <div className="text-left">
                                <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider block">今日の執筆ペース</span>
                                <span className="text-xs font-mono font-bold text-blue-700 block mt-0.5">{todayWords} 文字</span>
                              </div>
                              <div className="bg-blue-500/10 text-blue-600 text-[10px] py-1 px-2.5 rounded-full font-extrabold flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 animate-bounce" /> 連続 5 日保持🔥
                              </div>
                            </div>
                          </div>

                          {/* 2. 目標プログレスバー */}
                          <div className={`space-y-1.5 transition-opacity duration-200 ${!isPremium ? "filter blur-[1.5px] opacity-40 pointer-events-none" : ""}`}>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-sans">
                              <span>目標：{goal}文字</span>
                              <span>残り：{Math.max(0, goal - totalWords)}文字</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/50">
                              <div 
                                style={{ width: `${progressPercent}%` }}
                                className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>

                          {/* 3. Recharts 執筆ペース可視化チャート */}
                          <div className={`space-y-2 pt-1.5 border-t border-slate-50 transition-opacity duration-200 ${!isPremium ? "filter blur-[1.5px] opacity-40 pointer-events-none" : ""}`}>
                            <span className="text-[10px] text-slate-500 font-extrabold block">最近の執筆軌跡（文字数）</span>
                            <div className="h-32 w-full text-xs font-mono">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                  <XAxis dataKey="name" fontSize={9} stroke="#a1a1aa" />
                                  <YAxis fontSize={9} stroke="#a1a1aa" />
                                  <Tooltip />
                                  <Bar dataKey="words" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={18} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                        </div>
                      );
                    })()}

                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* ========================================================
         MODALS: 小説作成・編集モーダル (パレット決定ボタンを完全に担保)
         ======================================================== */}
      {showNovelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-amber-900/15 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-serif font-black text-amber-950 flex items-center gap-1.5">
                <Palette className="text-rose-800 w-5 h-5" />
                {editingNovel ? "小説の情報を再編集する" : "新しい物語のパレットを作成"}
              </h4>
              <button
                onClick={() => setShowNovelModal(false)}
                className="w-8 h-8 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-amber-950/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateNovel} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  小説タイトル（必須）
                </label>
                <input
                  type="text"
                  required
                  value={newNovelTitle}
                  onChange={(e) => setNewNovelTitle(e.target.value)}
                  placeholder="例：虹のオルゴールと時の歯車⚙️"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 focus:ring-2 focus:ring-amber-900 focus:border-amber-900 outline-none transition text-sm text-amber-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  あらすじ・第一歩の解説
                </label>
                <textarea
                  rows={2}
                  value={newNovelDesc}
                  onChange={(e) => setNewNovelDesc(e.target.value)}
                  placeholder="登場人物、舞台、あるいは思い描く最高のあらすじを自由に書こう。"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 focus:ring-2 focus:ring-amber-900 focus:border-amber-900 outline-none transition text-sm text-amber-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  テーマ・結末などの構想
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={newNovelTheme}
                    onChange={(e) => setNewNovelTheme(e.target.value)}
                    placeholder="全体の主題・テーマ"
                    className="w-full px-3 py-2 rounded-lg border border-amber-900/15 text-xs text-amber-950"
                  />
                  <input
                    type="text"
                    value={newNovelAudience}
                    onChange={(e) => setNewNovelAudience(e.target.value)}
                    placeholder="想定ターゲットの読者像"
                    className="w-full px-3 py-2 rounded-lg border border-amber-900/15 text-xs text-amber-950"
                  />
                </div>
                <input
                  type="text"
                  value={newNovelEnding}
                  onChange={(e) => setNewNovelEnding(e.target.value)}
                  placeholder="目指す結末・ラストシーンの概要"
                  className="w-full px-3 py-2 rounded-lg border border-amber-900/15 text-xs text-amber-950 mb-3"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-amber-900/50 block mb-1">目標執筆文字数</span>
                    <input
                      type="number"
                      value={newNovelWordGoal}
                      onChange={(e) => setNewNovelWordGoal(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3 py-2 rounded-lg border border-amber-900/15 text-xs text-amber-950 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-900/50 block mb-1">目標執筆日数</span>
                    <input
                      type="number"
                      value={newNovelWriteDays}
                      onChange={(e) => setNewNovelWriteDays(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 rounded-lg border border-amber-900/15 text-xs text-amber-950 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 表紙画像 (おしゃれなアップロードドラッグ枠＆手動入力のハイブリッド) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-amber-900/60 uppercase tracking-widest">
                  カバー・表紙画像
                </label>
                
                <div 
                  className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/10 hover:bg-pink-50/20 rounded-2xl p-4 transition-all text-center cursor-pointer group flex flex-col items-center justify-center min-h-[100px] gap-2"
                  onClick={() => {
                    const el = document.getElementById("novel-cover-raw-uploader");
                    if (el) el.click();
                  }}
                >
                  <input
                    id="novel-cover-raw-uploader"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewNovelCover(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  
                  {newNovelCover ? (
                    <div className="flex items-center gap-4 w-full text-left">
                      <img src={newNovelCover} alt="Preview" className="h-16 w-12 object-cover rounded-lg border border-pink-100 shadow-md" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">表紙画像を設定しました</span>
                        <p className="text-[9px] text-slate-400 mt-1">タップして別ファイルをアップロード</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-1">
                      <ImagePlus className="w-6 h-6 text-pink-400 group-hover:text-pink-500 mx-auto animate-bounce" />
                      <p className="text-[11px] text-slate-500 font-bold font-serif">ここをクリックして表紙をアップロード</p>
                      <p className="text-[9px] text-slate-400">または、画像のウェブURLを下に直接貼り付け</p>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={newNovelCover}
                  onChange={(e) => setNewNovelCover(e.target.value)}
                  placeholder="もしくは画像の直接URLを入力..."
                  className="w-full px-4 py-2 rounded-xl border border-amber-900/15 outline-none text-xs text-amber-955 bg-white/70"
                />
              </div>

              {/* ストーリーテンプレートの選択 (新規追加時のみ) */}
              {!editingNovel && (
                <div className="bg-pink-50/50 rounded-xl p-3.5 border border-pink-100 space-y-2">
                  <label className="block text-[11px] font-bold text-pink-700 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 物語の設計テンプレートを選択
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-pink-200 outline-none focus:border-pink-400 text-xs text-slate-800 font-bold"
                  >
                    <option value="none">✨ テンプレートなし（真っ白から自由に作る）</option>
                    <option value="novel_long">🌸 起承転結プロット＆長編執筆アドバイス付き（長編標準）</option>
                    <option value="novel_short">📝 はじまりとオチ＆短編の黄金律アドバイス付き（短編・掌編）</option>
                  </select>
                  <p className="text-[9px] text-pink-400 leading-relaxed font-semibold">
                    ※ パレット決定と同時に、物語の骨子となる構成プロットや特製の一筆箋（執筆への道標）が自動的・精細にアトリエ内へインジェクトされます！
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3.5 border-t border-amber-900/5">
                <button
                  type="button"
                  onClick={() => setShowNovelModal(false)}
                  className="bg-amber-900/5 hover:bg-amber-900/10 text-amber-950 font-bold py-2.5 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 px-6 rounded-full text-xs transition shadow-md shadow-amber-900/10"
                >
                  パレットを決定する🎨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODALS: プロット作成・編集
         ======================================================== */}
      {showPlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-amber-900/15 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-serif font-black text-amber-950 flex items-center gap-1.5">
                <Layers className="text-rose-840 w-5 h-5" />
                {editingPlot ? "プロットシーンを再編集する" : "新規プロットシーンの追加"}
              </h4>
              <button
                onClick={() => setShowPlotModal(false)}
                className="w-8 h-8 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-amber-950/65 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdatePlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1 bg-[#fff]">
                    起承転結フェーズ
                  </label>
                  <select
                    value={newPlotPhase}
                    onChange={(e) => setNewPlotPhase(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white rounded-lg border border-amber-900/15 outline-none text-xs text-amber-950"
                  >
                    <option value="起">🔴 起（オープニング・導入）</option>
                    <option value="承">🟡 承（展開・広がり・日常）</option>
                    <option value="転">🔵 転（トラブル・転換・変化）</option>
                    <option value="結">🟣 結（結末・解決・ラスト）</option>
                    <option value="設定">⚪ 設定（前提・世界観軸）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    時系列・発生タイミング
                  </label>
                  <input
                    type="text"
                    value={newPlotTimeline}
                    onChange={(e) => setNewPlotTimeline(e.target.value)}
                    placeholder="例: 第1日目の夜、物語終盤"
                    className="w-full px-3 py-2.5 bg-white rounded-lg border border-amber-900/15 outline-none text-xs text-amber-950 font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  プロットシーン標題（必須）
                </label>
                <input
                  type="text"
                  required
                  value={newPlotTitle}
                  onChange={(e) => setNewPlotTitle(e.target.value)}
                  placeholder="例: 運命の歯車が噛み合う瞬間"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 focus:ring-2 focus:ring-amber-900 outline-none text-sm text-amber-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  シーン概要・具体的な展開・伏線や台詞
                </label>
                <textarea
                  rows={4}
                  value={newPlotContent}
                  onChange={(e) => setNewPlotContent(e.target.value)}
                  placeholder="このシーンで何が起きるか、あらすじ、描きたいイメージを書き込みましょう。"
                  className="w-full px-4 py-3 rounded-xl border border-amber-900/15 focus:ring-2 focus:ring-amber-900 outline-none text-xs text-amber-950 font-serif"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-amber-900/5">
                <button
                  type="button"
                  onClick={() => setShowPlotModal(false)}
                  className="bg-amber-900/5 text-amber-950 font-bold py-2.5 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
                >
                  シーンを描き足す✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODALS: 登場人物作成＆再編集
         ======================================================== */}
      {showCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 border border-amber-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-serif font-black text-amber-950 flex items-center gap-1.5">
                <UserIcon className="text-rose-800 w-5 h-5" />
                {editingChar ? `登場人物「${editingChar.name}」の設定編集` : "新しい登場人物を創り出す"}
              </h4>
              <button
                onClick={() => setShowCharModal(false)}
                className="w-8 h-8 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-amber-950/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateCharacter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    キャラクター名（必須）
                  </label>
                  <input
                    type="text"
                    required
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="例：レオ、シエラ"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    役割・立場（主人公、ヒロイン、悪役、傍観者など）
                  </label>
                  <input
                    type="text"
                    value={newCharRole}
                    onChange={(e) => setNewCharRole(e.target.value)}
                    placeholder="例: 主人公、時間研究者、ライバル"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    年齢や生年月
                  </label>
                  <input
                    type="text"
                    value={newCharAge}
                    onChange={(e) => setNewCharAge(e.target.value)}
                    placeholder="例：16歳、あるいは不詳"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    重要設定：外見の特徴
                  </label>
                  <input
                    type="text"
                    value={newCharAppearance}
                    onChange={(e) => setNewCharAppearance(e.target.value)}
                    placeholder="例：青緑の瞳、真鍮めがね、古いコート"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    性格・MBTI
                  </label>
                  <input
                    type="text"
                    value={newCharPersonality}
                    onChange={(e) => setNewCharPersonality(e.target.value)}
                    placeholder="例：ISTP（合理的でマイペースだが、困っている人を放っておけない）"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    周囲との関係性設定
                  </label>
                  <input
                    type="text"
                    value={newCharRelation}
                    onChange={(e) => setNewCharRelation(e.target.value)}
                    placeholder="例：○○とは幼なじみであり、お互いの弱みを理解しているバディ関係"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                  />
                </div>
              </div>

              {/* キャラクターアイコンアップローダー */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest">
                  キャラクター姿絵 / アイコン画像設定
                </label>
                
                <div 
                  className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/10 hover:bg-pink-50/20 rounded-2xl p-4 transition-all text-center cursor-pointer group flex flex-col items-center justify-center min-h-[90px] gap-2"
                  onClick={() => {
                    const el = document.getElementById("char-avatar-raw-uploader");
                    if (el) el.click();
                  }}
                >
                  <input
                    id="char-avatar-raw-uploader"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewCharImageUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  
                  {newCharImageUrl ? (
                    <div className="flex items-center gap-4 w-full text-left">
                      <img src={newCharImageUrl} alt="Char Preview" className="h-16 w-16 object-cover rounded-full border-2 border-pink-200 shadow-md" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">姿絵を設定しました</span>
                        <p className="text-[9px] text-slate-400 mt-1">タップして違う画像に変更します</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-1">
                      <ImagePlus className="w-5 h-5 text-pink-400 group-hover:text-pink-500 mx-auto" />
                      <p className="text-[10px] text-slate-500 font-bold font-serif">ここをクリックしてキャラの画像・姿絵をアップロード</p>
                      <p className="text-[9px] text-slate-400">または、画像のウェブURLを下に貼り付け</p>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={newCharImageUrl}
                  onChange={(e) => setNewCharImageUrl(e.target.value)}
                  placeholder="もしくは姿絵の直接URLを入力..."
                  className="w-full px-4 py-2 border border-amber-900/15 rounded-xl text-xs text-amber-950 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  バックストーリー・誕生秘話や隠された秘密
                </label>
                <textarea
                  rows={2}
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="キャラクターの過去のトラウマ、物語中の目標、譲れない信念などを書いてあげよう。"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-xs text-amber-950 font-serif"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3.5 border-t border-amber-900/5">
                <button
                  type="button"
                  onClick={() => setShowCharModal(false)}
                  className="bg-amber-900/5 text-amber-900 font-bold py-2.5 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
                >
                  キャラクターを吹き込む✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODALS: 世界観資料・伏線
         ======================================================== */}
      {showWorldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-amber-900/15 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-serif font-black text-amber-950">
                {editingWorld ? "設定資料・伏線カードの再編集" : "世界観資料・伏線を記述する"}
              </h4>
              <button
                onClick={() => setShowWorldModal(false)}
                className="w-8 h-8 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-amber-950/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateSetting} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    設定カテゴリー
                  </label>
                  <select
                    value={newWorldCategory}
                    onChange={(e) => setNewWorldCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-amber-900/15 text-xs text-amber-955"
                  >
                    <option value="世界観">🏰 世界観・地理・歴史設定</option>
                    <option value="用語">📖 特殊用語・能力・アイテム</option>
                    <option value="年表">🕒 歴史的事件・年表・出来事</option>
                    <option value="その他">⚪ その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    伏線として登録する？
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="fusen_check"
                      checked={newWorldIsFusen}
                      onChange={(e) => setNewWorldIsFusen(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-900/10 text-rose-800 focus:ring-rose-800"
                    />
                    <label htmlFor="fusen_check" className="text-xs text-amber-900 font-bold select-none cursor-pointer">
                      伏線管理に紐付ける
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  資料・伏線の見出しタイトル
                </label>
                <input
                  type="text"
                  required
                  value={newWorldTitle}
                  onChange={(e) => setNewWorldTitle(e.target.value)}
                  placeholder="例：大沈黙の時間静止システム"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  設定内容・バックヤード詳細
                </label>
                <textarea
                  rows={4}
                  value={newWorldDetail}
                  onChange={(e) => setNewWorldDetail(e.target.value)}
                  placeholder="あなたが考えた独自用語、システムや伏線の発生原理などを事細かに言語化しよう！"
                  className="w-full px-4 py-3 rounded-xl border border-amber-900/15 text-xs text-amber-950 font-serif"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3.5 border-t border-amber-900/5">
                <button
                  type="button"
                  onClick={() => setShowWorldModal(false)}
                  className="bg-amber-900/5 text-amber-900 font-bold py-2 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-2 px-6 rounded-full text-xs transition animate-pulse"
                >
                  設定を記録する📚
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODALS: エピソード新規作成
         ======================================================== */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-amber-900/15 max-h-[90vh] overflow-y-auto">
            <h4 className="text-base font-serif font-black text-amber-950 mb-4">
              ✒️ 新しいエピソード・執筆の章を作ろう
            </h4>

            <form onSubmit={handleCreateEpisode} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  章タイトル、あるいは一話の見出し
                </label>
                <input
                  type="text"
                  required
                  value={newEpisodeTitle}
                  onChange={(e) => setNewEpisodeTitle(e.target.value)}
                  placeholder="例：プロローグ：動き出す静寂"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    初期状態
                  </label>
                  <select
                    value={newEpisodeStatus}
                    onChange={(e) => setNewEpisodeStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-amber-900/15 text-xs text-amber-955"
                  >
                    <option value="下書き">✏️ 下書き</option>
                    <option value="完成">✅ 完成</option>
                    <option value="推敲中">🔍 推敲中</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                    タグ種別
                  </label>
                  <select
                    value={newEpisodeTag}
                    onChange={(e) => setNewEpisodeTag(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-amber-900/15 text-xs text-amber-955"
                  >
                    <option value="プロローグ">プロローグ</option>
                    <option value="本編">本編（メインエピソード）</option>
                    <option value="エピローグ">エピローグ（結末・後日談）</option>
                    <option value="その他">その他（スピンオフなど）</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3.5 border-t border-amber-900/5">
                <button
                  type="button"
                  onClick={() => setShowEpisodeModal(false)}
                  className="bg-amber-900/5 text-amber-900 font-bold py-2 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
                >
                  アトリエに一話執筆用紙を追加✒️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODALS: メモの作成・再編集
         ======================================================== */}
      {showMemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-amber-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-serif font-black text-amber-950">
                {editingMemo ? `ひらめき「${editingMemo.title}」の編集` : "ひらめきアイデアの一筆箋"}
              </h4>
              <button
                onClick={() => setShowMemoModal(false)}
                className="w-8 h-8 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-amber-950/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateMemo} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  付箋の色
                </label>
                <div className="flex gap-2.5">
                  {[
                    { color: "#fffbeb", name: "イエロー" },
                    { color: "#fdf2f8", name: "ピンク" },
                    { color: "#f0fdf4", name: "グリーン" },
                    { color: "#f0f9ff", name: "ブルー" },
                    { color: "#faf5ff", name: "パープル" },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setNewMemoColor(preset.color)}
                      style={{ backgroundColor: preset.color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newMemoColor === preset.color ? "border-amber-900 scale-115 shadow" : "border-amber-900/15 scale-100"
                      }`}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  メモのタイトル（任意）
                </label>
                <input
                  type="text"
                  value={newMemoTitle}
                  onChange={(e) => setNewMemoTitle(e.target.value)}
                  placeholder="例：中盤のセリフ案"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-900/15 text-sm text-amber-955"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900/60 uppercase tracking-widest mb-1.5">
                  ひらめき内容・台詞集
                </label>
                <textarea
                  rows={4}
                  value={newMemoContent}
                  onChange={(e) => setNewMemoContent(e.target.value)}
                  placeholder="ここにふと思いついた情景やエピソードアイデア、セリフ案を自由に書きだそう。"
                  className="w-full px-4 py-3 rounded-xl border border-amber-900/15 text-xs text-amber-950 font-serif"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3.5 border-t border-amber-900/5">
                <button
                  type="button"
                  onClick={() => setShowMemoModal(false)}
                  className="bg-amber-900/5 text-amber-900 font-bold py-2 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
                >
                  一筆箋を貼る💡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 全横断検索エンジンモーダル (みつきへの全力Tiおもてなし) --- */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-left flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-pink-50/20">
              <span className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                <Search className="w-4 h-4" /> 横断ストーリー検索
              </span>
              <button 
                onClick={() => setShowSearchModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50/50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="プロット、登場人物、セリフ、付箋メモなどを検索入力..."
                className="w-full px-4 py-3 rounded-2xl border border-pink-200/60 focus:border-pink-500 outline-none text-sm text-slate-800 bg-white"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {searchQuery.trim().length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Sparkles className="w-8 h-8 text-pink-200 animate-pulse" />
                  <p>キーワードを入力すると、アトリエ内の全設定から検索されます</p>
                </div>
              ) : (() => {
                const results: any[] = [];
                const query = searchQuery.toLowerCase();

                // Novels
                novels.forEach(n => {
                  if (n.title.toLowerCase().includes(query) || (n.description && n.description.toLowerCase().includes(query))) {
                    results.push({ type: "小説", title: n.title, context: n.description, item: n, action: () => { setSelectedNovel(n); } });
                  }
                });
                // Episodes
                episodes.forEach(e => {
                  if (e.title?.toLowerCase().includes(query) || e.body?.toLowerCase().includes(query)) {
                    const novel = novels.find(n => n.id === e.novelId);
                    results.push({ type: "エピソード", title: `${novel ? novel.title : "小説"} > ${e.title || '無題'}`, context: e.body, item: e, action: () => { if (novel) setSelectedNovel(novel); setActiveEpisode(e); setActiveTab("write"); } });
                  }
                });
                // Plots
                plots.forEach(p => {
                  if (p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query)) {
                    const novel = novels.find(n => n.id === p.novelId);
                    results.push({ type: "プロット", title: `${novel ? novel.title : "小説"} > ${p.title || '無題'}`, context: p.content, item: p, action: () => { if (novel) setSelectedNovel(novel); setActiveTab("plots"); } });
                  }
                });
                // Characters
                characters.forEach(c => {
                  if (c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)) {
                    const novel = novels.find(n => n.id === c.novelId);
                    results.push({ type: "キャラクター", title: `${novel ? novel.title : "小説"} > ${c.name}`, context: `配役: ${c.role} | ${c.description || ''}`, item: c, action: () => { if (novel) setSelectedNovel(novel); setActiveTab("relations"); } });
                  }
                });
                // World
                worldSettings.forEach(w => {
                  if (w.title.toLowerCase().includes(query) || w.detail.toLowerCase().includes(query)) {
                    const novel = novels.find(n => n.id === w.novelId);
                    results.push({ type: "世界観設定", title: `${novel ? novel.title : "小説"} > ${w.category}: ${w.title}`, context: w.detail, item: w, action: () => { if (novel) setSelectedNovel(novel); setActiveTab("theme"); } });
                  }
                });
                // Memos
                memos.forEach(m => {
                  if (m.title?.toLowerCase().includes(query) || m.content.toLowerCase().includes(query)) {
                    const novel = novels.find(n => n.id === m.novelId);
                    results.push({ type: "付箋メモ", title: `${novel ? novel.title : "小説"} > ${m.title || 'ひらめき付箋'}`, context: m.content, item: m, action: () => { if (novel) setSelectedNovel(novel); setActiveTab("memos"); } });
                  }
                });

                if (results.length === 0) {
                  return (
                    <p className="text-center py-10 text-slate-400 text-xs">
                      「{searchQuery}」に一致するコンテンツは見つかりませんでした 🔍
                    </p>
                  );
                }

                return results.map((res, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (res.action) res.action();
                      setShowSearchModal(false);
                    }}
                    className="p-3 bg-slate-50 hover:bg-pink-50/50 border border-slate-100 rounded-xl cursor-pointer transition flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        {res.type}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h6 className="text-[11px] font-black text-rose-950">{res.title}</h6>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {res.context || "詳細なし"}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* --- プレミアム快適化アップグレードモーダル (安心のBOOTH合言葉開錠) --- */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-amber-600 flex items-center gap-1.5 uppercase tracking-widest">
                <Crown className="w-4 h-4 animate-bounce" /> Plot Palette Premium
              </span>
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 space-y-2">
              <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1">プレミアム快適化プラン解放 ✨</h4>
              <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                プレミアムプランへアップグレードすると、**1600万色カラーパレットの完全調色**、**すべての限定テーマパレット🌸🕯️🌿🌃**、およびその他のラグジュアリーな執筆用背景が永久解放されます！
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 tracking-wider">
                  BOOTH購入注文証明合言葉を入力
                </label>
                <input
                  type="password"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="注文番号に続いて、BOOTH合言葉を入力してください..."
                  className="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:border-pink-500 outline-none text-xs text-slate-800"
                />
                <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                  ※BOOTHでもふみつ工房のアイテムをご購入いただき、同封の合言葉キーワードを含めてご記入ください。
                </p>
              </div>

              <div className="pt-2 flex justify-between gap-3 items-center">
                <a
                  href="https://torisproject.booth.pm/items/8498231"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-full text-xs transition flex items-center gap-1 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  BOOTHでプレミアム機能を確認
                </a>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPremiumModal(false)}
                    className="bg-slate-50 hover:bg-slate-150 text-slate-600 font-bold py-2 px-5 rounded-full text-xs transition"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (codeInput.includes("MofuPlot25")) {
                      setIsPremium(true);
                      localStorage.setItem("plot_palette_premium_v1", "true");
                      toast.success("👑 プレミアム快適化が正常にアクティベートされました！すべての機能をご堪能ください。");
                      setShowPremiumModal(false);
                    } else {
                      toast.error("❌ 合言葉が確認できませんでした。正しいキーワードが含まれているか、もう一度お確かめください。");
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2.5 px-6 rounded-full text-xs tracking-wider transition shadow-md shadow-amber-200/50"
                >
                  アップグレード認定 👑
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 使い方マニュアルモーダル (知的で可愛いガイド) --- */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden text-left flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-pink-50/20">
              <span className="text-xs font-black text-pink-700 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: "var(--accent-color)" }}>
                <BookOpen className="w-4 h-4 animate-bounce shrink-0" /> Plot Palette の使い方 🎨
              </span>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 leading-relaxed bg-white">
              <div className="space-y-2">
                <h4 className="text-sm font-black text-pink-700 flex items-center gap-1" style={{ color: "var(--accent-color)" }}>✨ ストーリーづくりのパレットへようこそ</h4>
                <p className="text-xs text-slate-600">
                  Plot Palette は、小説、アニメ、ゲームなどのプロット（骨組み）、登場人物、世界観設定を絵の具をパレットにのせるようにパッと可視化し、美しく快適に執筆・エクスポートできる創作支援アトリエです。
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shrink-0 font-extrabold text-sm shadow-sm">1</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">プロット（起承転結）を練る</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      小説を選択後、「プロット」タブから起承転結の各段落にストーリーのキーアイテムや「事件（インシデント）」をカード形式で貼っていけます。起・承・転・結の各構造をスッキリと一覧してストーリーの起伏が崩れていないか整えることができます。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shrink-0 font-extrabold text-sm shadow-sm">2</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">登場人物・配役パレットをつくる</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      「登場人物」タブでは、キャラクターの配役（主人公、お助けキャラ、ライバル等）、外見、性格、および無限のカスタムプロフィールを追加できます！さらに、各キャラクターへ設定を結び、執筆へのモチベーションを高めます。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shrink-0 font-extrabold text-sm shadow-sm">3</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">世界観や年表・伏線回収</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      用語集や歴史年表、そして創作で最も失念しがちな「伏線伏線（Fusen）」を設定し、それらが回収されたかどうか「未回収」「回収済」のオンオフスイッチで視覚的にマーク。これでもうお話の破綻とはおさらばです！
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shrink-0 font-extrabold text-sm shadow-sm">4</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">ひらめき付箋・一筆スクラップ</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      「ひらめき付箋（Memos）」は、いつでも瞬時にセリフや情景案、後々使いたいアイデアをカードの一筆箋にしてスクラップ貼り付け。横断検索エンジン（虫眼鏡検索）とも連動するため、どこに書いても一瞬で発見できます！
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shrink-0 font-extrabold text-sm shadow-sm">5</div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">エディター執筆（縦書き ↔ 横書き） 🖨️</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      縦書きモードを使うと、日本の美しい縦書き原稿用紙スタイルで、心地よい余白とともに感情豊かに物語を書き留められます。PDF/印刷出力機能を使うと、各お話をそのまま縦書きの綺麗な小説組版にしてPDF保存＆印刷できます！
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-500/10 to-amber-500/10 rounded-2xl p-4 border border-pink-100 flex items-center gap-3" style={{ borderColor: "var(--border-color)" }}>
                <Crown className="w-8 h-8 text-amber-500 shrink-0 animate-bounce" />
                <div className="text-[11px] text-pink-950">
                  <p className="font-extrabold">👑 プレミアム快適化機能について</p>
                  <p className="opacity-80">カスタム調色パレットを使うと、1600万色の中からあなたの作品ごとのテーマ背景色を調色してアトリエを美しく彩ることが可能です。BOOTHの合言葉「MofuPlot25」でアクティベートできます！</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="bg-pink-600 hover:bg-pink-700 text-white font-black py-2 px-6 rounded-full text-xs transition shadow-md shadow-pink-200"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                了解した ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- クラウド同期・接続診断モーダル --- */}
      {showDbStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 text-slate-800" style={{ color: "#1f2937" }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-left flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
              <span className="text-xs font-black text-violet-700 flex items-center gap-1.5 uppercase tracking-wide">
                <CloudLightning className="w-4 h-4 animate-pulse shrink-0" /> アトリエ接続・同期診断 📡
              </span>
              <button 
                onClick={() => setShowDbStatusModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700 leading-relaxed bg-white">
              {/* 同期ステータス識別 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">アカウントログイン</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    user ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {user ? "Googleログイン中" : "未ログイン (ローカル)"}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 text-[11px]">
                    <span className="text-slate-400">ログインユーザー名</span>
                    <span className="font-bold text-slate-600">{user.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                  <span className="text-xs font-bold text-slate-500">クラウドデータベース接続</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    dbStatusData && !dbStatusData.error && dbStatusData.logs?.some((l: string) => l.includes("successfully"))
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}>
                    {isCheckingDb ? "診断中..." : dbStatusData && !dbStatusData.error && dbStatusData.logs?.some((l: string) => l.includes("successfully")) ? "オンライン (Supabase)" : "非アクティブ (未接続/エラー)"}
                  </span>
                </div>
              </div>

              {/* 接続結果サマリー */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">📡 同期アナリストの回答</h4>
                {isCheckingDb ? (
                  <p className="text-xs text-slate-500">現在、雲の上（クラウド）とアトリエの通信経路をテスト中です...</p>
                ) : !user ? (
                  <p className="text-xs text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 font-medium">
                    現在Googleログインがされていないため、作成したデータは**「お使いのこのブラウザ内（LocalStorage）」**に保管されています。スマホや別PCなど他のデバイスと作品を同期するには、Googleでのログインを行ってください！
                  </p>
                ) : dbStatusData?.error ? (
                  <p className="text-xs text-rose-600 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60 font-medium">
                    ログインは完了していますが、何らかの理由で診断APIがエラーを返しました：<br/>
                    <strong className="block mt-1 font-mono">{dbStatusData.error}</strong>
                  </p>
                ) : dbStatusData && dbStatusData.logs?.some((l: string) => l.includes("failed")) ? (
                  <div className="space-y-2">
                    <p className="text-xs text-rose-600 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60 font-medium">
                      Googleログイン中ですが、**クラウドデータベース（Supabase）の初期テーブル自動作成処理でトラブルが発生**しているようです。そのため、データが一時的にローカルストレージへ退避（フォールバック）保存されている可能性があります。
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 flex flex-col gap-1">
                    <span>🎉 **クラウド同期は完全に機能しています！**</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      作成されたデータはすべてSupabaseサーバーに自動保存されます。スマホや他のPCのブラウザからでも、同じGoogleアカウントでログインすると、全く同じ作品データ、登場人物、世界観を自動で同期＆共有して執筆を開始できます！
                    </span>
                  </p>
                )}
              </div>

              {/* 初期化システムログ (隠し表示・デバッグ用) */}
              {dbStatusData && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block">🔮 データベース初期化ログ（Drizzle & Postgres）</span>
                  <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3 rounded-xl overflow-x-auto max-h-40 overflow-y-auto space-y-1">
                    {dbStatusData.logs && dbStatusData.logs.length > 0 ? (
                      dbStatusData.logs.map((log: string, idx: number) => {
                        let color = "text-slate-300";
                        if (log.includes("✔") || log.includes("🎉")) color = "text-emerald-400";
                        if (log.includes("❌") || log.includes("error") || log.includes("failed")) color = "text-rose-400";
                        if (log.includes("⚠")) color = "text-amber-400";
                        return <div key={idx} className={color}>{log}</div>;
                      })
                    ) : (
                      <div className="text-slate-500">初期化コンテンツはありません。</div>
                    )}
                  </div>
                </div>
              )}

              {/* 再診ボタン */}
              <button
                type="button"
                onClick={checkDbStatus}
                disabled={isCheckingDb}
                className="w-full py-2.5 rounded-2xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition"
              >
                {isCheckingDb ? "再テスト診断中..." : "接続状態をもう一度テストする 🔄"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 作品シェアモーダル (可愛くて広報に便利) --- */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-left flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-pink-50/20">
              <span className="text-xs font-black text-pink-700 flex items-center gap-1.5 uppercase tracking-wide font-sans" style={{ color: "var(--accent-color)" }}>
                <Share2 className="w-4 h-4 text-pink-500 shrink-0" /> 作品＆アトリエをシェア 📢
              </span>
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 bg-white">
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                現在描いている素晴らしいストーリーや、この創作パレットの存在を、SNS等に投稿・共有して世に知らせてみませんか？
              </p>

              <div className="border border-pink-100 bg-[#fff0f3]/10 rounded-2xl p-4 space-y-3" style={{ borderColor: "var(--border-color)" }}>
                <span className="text-[10px] font-black tracking-wider bg-pink-200 text-pink-800 px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-light, #fef1f2)", color: "var(--accent-color)" }}>X (Twitter) 配信用下書きテキスト</span>
                
                <textarea
                  readOnly
                  rows={5}
                  value={
                    selectedNovel 
                      ? `私の執筆アトリエ「Plot Palette」で、創作小説『${selectedNovel.title}』のプロットを構築中！✨\n\nあらすじ: ${selectedNovel.description ? selectedNovel.description.substring(0, 50) + "..." : "設定中..."}\n\n使っている創作ツール 👇\nhttps://plot-palette.onrender.com/\n#PlotPalette #もふみつ工房`
                      : `創作ストーリー支援アトリエ「Plot Palette」でプロットや関係図、世界観伏線を構築しています！🎨\n起承転結を並べて美しい小説、お話を。縦書き全画面執筆も最高に捗る…！\n\n使っている創作ツール 👇\nhttps://plot-palette.onrender.com/\n#PlotPalette #もふみつ工房`
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const shareText = selectedNovel 
                      ? `私の執筆アトリエ「Plot Palette」で、創作小説『${selectedNovel.title}』のプロットを構築中！✨\n\nあらすじ: ${selectedNovel.description ? selectedNovel.description.substring(0, 50) + "..." : "設定中..."}\n\n使っている創作ツール 👇\nhttps://plot-palette.onrender.com/\n#PlotPalette #もふみつ工房`
                      : `創作ストーリー支援アトリエ「Plot Palette」でプロットや関係図、世界観伏線を構築しています！🎨\n起承転結を並べて美しい小説、お話を。縦書き全画面執筆も最高に捗る…！\n\n使っている創作ツール 👇\nhttps://plot-palette.onrender.com/\n#PlotPalette #もふみつ工房`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: 'Plot Palette',
                        text: shareText,
                      }).catch((err) => {
                        console.error('Error sharing:', err);
                      });
                    } else {
                      navigator.clipboard.writeText(shareText);
                      toast.success("📋 共有機能がサポートされていないため、テキストをクリップボードにコピーしました！SNS等で共有してください。");
                    }
                  }}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-black py-3 px-4 rounded-xl transition text-center flex items-center justify-center gap-2 shadow-sm"
                  style={{ backgroundColor: "var(--accent-color)" }}
                >
                  <Share2 className="w-4 h-4" />
                  <span>アプリを通して共有する</span>
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="bg-pink-100 hover:bg-pink-200 text-pink-700 font-black py-1.5 px-5 rounded-full text-xs transition"
                style={{ backgroundColor: "var(--accent-light, #fef1f2)", color: "var(--accent-color)" }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 印刷/PDFエクスポート専用フルスクリーンDOM (印刷時以外は非表示) --- */}
      {isPrintingMode && printingEpisode && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto p-12 text-slate-900 block" id="print-canvas-area" style={{ color: "#111" }}>
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-black font-serif pb-4 border-b-2 border-dashed border-red-200 tracking-wide text-rose-900 flex justify-between items-center text-left">
              <span>{printingEpisode.title || "無題"}</span>
              <button 
                onClick={() => {
                  setIsPrintingMode(false);
                  setPrintingEpisode(null);
                }}
                className="print:hidden text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl border border-slate-200"
              >
                印刷モードを抜ける ↩
              </button>
            </h1>
            <div className="text-base leading-loose font-serif tracking-wider whitespace-pre-wrap text-justify py-4 min-h-[500px]">
              {(printingEpisode.body || "").split("\n").map((para, idx) => (
                <p key={idx} className="mb-4 text-[16px] leading-[2.3]">
                  {para}
                </p>
              ))}
            </div>
            
            {!isPremium && (
              <div className="mt-12 text-center text-[10px] text-slate-400 font-sans tracking-widest border-t border-slate-100 pt-4">
                 Created by 創作支援アトリエ Plot Palette
              </div>
            )}
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="mt-16 border-t py-10 transition-all animate-in fade-in duration-200" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <p className="text-center text-xs tracking-wider leading-loose font-bold" style={{ color: "var(--text-muted)" }}>
          🎨 Plot Palette Pro &copy; 2026 / もふみつ工房 — Designed with Gemini (Je-mi)
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5 mt-3 text-[11px] font-bold text-center">
          <span className="text-pink-400">📬 お問い合わせ・ご要望はコチラ ➔</span>
          <a 
            href="https://mofu-mitsu.github.io/mofumofu-room/" 
            target="_blank" 
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="text-pink-600 hover:text-pink-700 underline flex items-center gap-1"
          >
            もふもふルーム (mofumofu-room) ✨
          </a>
        </div>
      </footer>
    </div>
  );
}
