import React, { useState, useEffect } from "react";
import Login from "./pages/Login";

interface User {
  openId: string;
  name: string;
  email: string;
}

interface Novel {
  id: string;
  title: string;
  description: string;
  coverImage: string;
}

interface Plot {
  id: string;
  novelId: string;
  title: string;
  content: string;
}

interface Character {
  id: string;
  novelId: string;
  name: string;
  role: string;
  description: string;
  age: string;
  appearance: string;
  personality: string;
  relationInfo: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboards States
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [activeTab, setActiveTab] = useState<"plots" | "characters">("plots");

  // Plots / Characters of the selected novel
  const [plots, setPlots] = useState<Plot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Modals & New Form States
  const [showNovelModal, setShowNovelModal] = useState(false);
  const [newNovelTitle, setNewNovelTitle] = useState("");
  const [newNovelDesc, setNewNovelDesc] = useState("");
  const [newNovelCover, setNewNovelCover] = useState("");

  const [showPlotModal, setShowPlotModal] = useState(false);
  const [newPlotTitle, setNewPlotTitle] = useState("");
  const [newPlotContent, setNewPlotContent] = useState("");
  const [viewingPlot, setViewingPlot] = useState<Plot | null>(null);

  const [showCharModal, setShowCharModal] = useState(false);
  const [viewingChar, setViewingChar] = useState<Character | null>(null);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState("");
  const [newCharAge, setNewCharAge] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharAppearance, setNewCharAppearance] = useState("");
  const [newCharPersonality, setNewCharPersonality] = useState("");
  const [newCharRelation, setNewCharRelation] = useState("");

  // Check login session
  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
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

  // Fetch index data once user is resolved
  useEffect(() => {
    if (user) {
      fetch("/api/novels")
        .then((res) => res.json())
        .then((data) => setNovels(data))
        .catch((err) => console.error("Failed to load novels", err));
    }
  }, [user]);

  // Fetch plots / characters when selected novel changes
  useEffect(() => {
    if (selectedNovel) {
      // Plots
      fetch(`/api/novels/${selectedNovel.id}/plots`)
        .then((res) => res.json())
        .then((data) => setPlots(data))
        .catch((err) => console.error("Failed to fetch plots", err));

      // Characters
      fetch(`/api/novels/${selectedNovel.id}/characters`)
        .then((res) => res.json())
        .then((data) => setCharacters(data))
        .catch((err) => console.error("Failed to fetch characters", err));
    }
  }, [selectedNovel]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setSelectedNovel(null);
  };

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNovelTitle.trim()) return;

    try {
      const res = await fetch("/api/novels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNovelTitle,
          description: newNovelDesc,
          coverImage: newNovelCover,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNovels([...novels, data]);
        setNewNovelTitle("");
        setNewNovelDesc("");
        setNewNovelCover("");
        setShowNovelModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNovel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("本当にこのプロット設定をすべて削除しますか？")) return;

    try {
      const res = await fetch(`/api/novels/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNovels(novels.filter((n) => n.id !== id));
        if (selectedNovel?.id === id) {
          setSelectedNovel(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || !newPlotTitle.trim()) return;

    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/plots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPlotTitle,
          content: newPlotContent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlots([...plots, data]);
        setNewPlotTitle("");
        setNewPlotContent("");
        setShowPlotModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel || !newCharName.trim()) return;

    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCharName,
          role: newCharRole,
          description: newCharDesc,
          age: newCharAge,
          appearance: newCharAppearance,
          personality: newCharPersonality,
          relationInfo: newCharRelation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCharacters([...characters, data]);
        setNewCharName("");
        setNewCharRole("");
        setNewCharAge("");
        setNewCharDesc("");
        setNewCharAppearance("");
        setNewCharPersonality("");
        setNewCharRelation("");
        setShowCharModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50/30">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-primary/20 border-t-pink-500 rounded-full animate-spin"></div>
          <i className="fas fa-palette text-pink-400 text-2xl animate-pulse"></i>
        </div>
        <p className="mt-6 text-pink-600 font-medium tracking-wider">Plot Palette をロード中...🌸</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Determine actual display name (friendly Greet)
  const displayName = user.name.includes("Test") || user.name.includes("みつき") ? "みつき" : user.name;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans">
      {/* ナビゲーションヘッダー */}
      <header className="bg-white border-b border-pink-100 shadow-sm sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setSelectedNovel(null)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-100">
            <i className="fas fa-palette"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
              Plot Palette
            </h1>
            <p className="text-xs text-slate-400 font-medium">小説・プロット設定管理</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            おかえりなさい、<strong className="text-pink-500 font-bold">{displayName}</strong>先生！🌸
          </span>
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-105 border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-semibold transition"
          >
            <i className="fas fa-sign-out-alt mr-1.5"></i>
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!selectedNovel ? (
          /* ==================== 小説一覧画面 ==================== */
          <div>
            {/* ウェルカムバナー */}
            <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 rounded-3xl p-8 text-white shadow-xl shadow-pink-100/50 mb-10 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
                <i className="fas fa-feather text-[200px]"></i>
              </div>
              <div className="relative z-10 max-w-xl">
                <span className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase">創作スタジオ🎨</span>
                <h2 className="text-3xl font-black mt-4 mb-2 tracking-tight">あなたの心に描いた物語を紡ぎましょう✨</h2>
                <p className="text-pink-50/90 text-sm leading-relaxed mb-6">
                  Plot Palette（プロットパレット）へようこそ！ここはあなたの想像力を豊かに広げ、プロットやキャラクター設定を1ヶ所で美しく整理するアトリエです。心配ごとは置いて、好きな創作に浸りましょう💕
                </p>
                <button
                  onClick={() => setShowNovelModal(true)}
                  className="bg-white text-pink-600 font-bold px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <i className="fas fa-paint-brush"></i>
                  新しい物語を描く
                </button>
              </div>
            </div>

            {/* 一覧セクション */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <i className="fas fa-book text-pink-400"></i>
                創作中の世界
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{novels.length} 作品管理中</span>
            </div>

            {novels.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-pink-100 rounded-2xl p-16 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-50 rounded-full text-pink-400 text-2xl mb-4">
                  <i className="fas fa-feather-alt"></i>
                </div>
                <h4 className="text-lg font-bold text-slate-700 mb-1">まだ描かれた物語がありません</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  あなたの物語のパレットはまだ真っ白。最初の小説のプロット設定を作成して、輝くキャラクターやエピソードを描き出しましょう！
                </p>
                <button
                  onClick={() => setShowNovelModal(true)}
                  className="bg-pink-100 hover:bg-pink-200/80 text-pink-600 font-bold px-5 py-2.5 rounded-full transition"
                >
                  <i className="fas fa-plus mr-1.5"></i>
                  新しく小説を作成
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {novels.map((novel) => (
                  <div
                    key={novel.id}
                    onClick={() => setSelectedNovel(novel)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:border-pink-200 transition-all duration-310 cursor-pointer overflow-hidden flex flex-col group"
                  >
                    <div className="h-44 overflow-hidden relative bg-gradient-to-br from-pink-400/20 to-rose-400/20">
                      <img
                        src={novel.coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400"}
                        alt={novel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="bg-pink-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                          NOVEL
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="text-lg font-bold text-slate-800 mb-2 truncate group-hover:text-pink-500 transition">
                        {novel.title}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">
                        {novel.description || "設定や概要がまだありません。クリックして最初のプロットやキャラクターを描き足しましょう！"}
                      </p>
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span className="hover:text-pink-500 flex items-center gap-1 text-pink-400">
                          <i className="fas fa-edit"></i>
                          アトリエを開く
                        </span>
                        <button
                          onClick={(e) => handleDeleteNovel(novel.id, e)}
                          className="text-slate-350 hover:text-rose-500 p-1 rounded hover:bg-rose-50/50 transition"
                          title="削除"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ==================== 小説詳細ダッシュボード (創作パレット) ==================== */
          <div>
            {/* 戻るナビ */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedNovel(null)}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-pink-500 font-bold transition"
              >
                <i className="fas fa-arrow-left"></i>
                物語のアトリエに戻る
              </button>
            </div>

            {/* 開いている小説の概要 */}
            <div className="bg-white rounded-3xl border border-pink-50 p-6 shadow-sm flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                <img
                  src={selectedNovel.coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400"}
                  alt={selectedNovel.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs bg-pink-100 text-pink-600 px-2.5 py-1 rounded-full font-bold">執筆中🌸</span>
                <h3 className="text-2xl font-black mt-2 text-slate-800">{selectedNovel.title}</h3>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                  {selectedNovel.description || "この小説の説明、プロット、そして登場人物の設計を追加できます。"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPlotModal(true)}
                  className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-full transition-all flex items-center gap-1.5"
                >
                  <i className="fas fa-folder-plus"></i>
                  新しいエピソード
                </button>
                <button
                  onClick={() => setShowCharModal(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-full transition-all flex items-center gap-1.5"
                >
                  <i className="fas fa-user-plus"></i>
                  新しい登場人物
                </button>
              </div>
            </div>

            {/* タブ切り替え */}
            <div className="flex border-b border-slate-100 mb-6 gap-3">
              <button
                onClick={() => setActiveTab("plots")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === "plots"
                    ? "border-pink-500 text-pink-500"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <i className="fas fa-stream"></i>
                プロット（エピソード・章構成）
              </button>
              <button
                onClick={() => setActiveTab("characters")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === "characters"
                    ? "border-indigo-500 text-indigo-500"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <i className="fas fa-users"></i>
                パレット（キャラクター・相関設定）
              </button>
            </div>

            {/* ==================== プロット表示 ==================== */}
            {activeTab === "plots" && (
              <div>
                {plots.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 max-w-2xl mx-auto">
                    <i className="fas fa-map text-pink-300 text-3xl mb-4"></i>
                    <h5 className="font-bold text-slate-700 text-lg mb-1">プロットのタイムラインはまだ真っ白です</h5>
                    <p className="text-slate-400 text-sm mb-6">
                      第1話、キーとなるクライマックスなど、浮かんだエピソードやシーンのプロットを追加しましょう！
                    </p>
                    <button
                      onClick={() => setShowPlotModal(true)}
                      className="bg-pink-100 text-pink-600 font-bold text-xs px-4 py-2 rounded-full transition hover:bg-pink-200"
                    >
                      最初のプロットを描く
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plots.map((plot, idx) => (
                      <div
                        key={plot.id}
                        onClick={() => setViewingPlot(plot)}
                        className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-pink-200 hover:shadow-sm cursor-pointer transition flex items-start gap-4"
                      >
                        <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 text-pink-500 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-slate-800 text-lg mb-1 hover:text-pink-500 transition">{plot.title}</h5>
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                            {plot.content || "エピソード詳細がまだ書かれていません。クリックして物語を描きましょう！"}
                          </p>
                        </div>
                        <span className="text-xs text-slate-350 font-semibold self-center">
                          詳細表示 <i className="fas fa-chevron-right ml-1"></i>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== 登場人物パレット ==================== */}
            {activeTab === "characters" && (
              <div>
                {characters.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 max-w-2xl mx-auto">
                    <i className="fas fa-user-circle text-indigo-300 text-3xl mb-4"></i>
                    <h5 className="font-bold text-slate-700 text-lg mb-1">キャラクターパレットが空です</h5>
                    <p className="text-slate-400 text-sm mb-6">
                      物語の魂である主人公、ライバルや導き手の登場人物を創り上げて、お互いの関係性を紡ぎましょう。
                    </p>
                    <button
                      onClick={() => setShowCharModal(true)}
                      className="bg-indigo-100 text-indigo-600 font-bold text-xs px-4 py-2 rounded-full transition hover:bg-indigo-200"
                    >
                      登場人物を創る
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        onClick={() => setViewingChar(char)}
                        className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-indigo-250 hover:shadow-md cursor-pointer transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded">
                              {char.role || "設定なし"}
                            </span>
                            {char.age && (
                              <span className="text-xs text-slate-400 font-semibold">{char.age}歳</span>
                            )}
                          </div>
                          <h5 className="text-lg font-bold text-slate-800 mb-2">{char.name}</h5>
                          <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-4">
                            {char.description || "キャラクター詳細情報がまだありません。"}
                          </p>
                        </div>
                        {char.relationInfo && (
                          <div className="bg-indigo-50/30 rounded-xl p-3 border border-indigo-50">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wide">関係性メモ🎨</p>
                            <p className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">{char.relationInfo}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== 小説作成モーダル ==================== */}
      {showNovelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-pink-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-paint-brush text-pink-500"></i>
                新しい物語を紡ぎ出す
              </h4>
              <button
                onClick={() => setShowNovelModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateNovel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  小説タイトル（必須）
                </label>
                <input
                  type="text"
                  required
                  value={newNovelTitle}
                  onChange={(e) => setNewNovelTitle(e.target.value)}
                  placeholder="例：虹のパレットと碧のプロット"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  あらすじ・解説
                </label>
                <textarea
                  rows={3}
                  value={newNovelDesc}
                  onChange={(e) => setNewNovelDesc(e.target.value)}
                  placeholder="例：世界から色が消え、創作の力を得た少女が色を取り戻すインスピレーション小説。"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  カバー画像のURL (Unsplash等の画像アドレス)
                </label>
                <input
                  type="url"
                  value={newNovelCover}
                  onChange={(e) => setNewNovelCover(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition text-sm text-slate-800"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNovelModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-2.5 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-6 rounded-full text-xs transition shadow-md shadow-pink-100"
                >
                  パレットを決定する🎨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== プロット作成モーダル ==================== */}
      {showPlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-pink-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-folder-plus text-pink-500"></i>
                新規エピソード・プロット作成
              </h4>
              <button
                onClick={() => setShowPlotModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreatePlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  プロット・章の標題
                </label>
                <input
                  type="text"
                  required
                  value={newPlotTitle}
                  onChange={(e) => setNewPlotTitle(e.target.value)}
                  placeholder="例：第1話、あるいは決戦のシーン"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  エピソード概要・シーン詳細
                </label>
                <textarea
                  rows={5}
                  value={newPlotContent}
                  onChange={(e) => setNewPlotContent(e.target.value)}
                  placeholder="このエピソードで何が起きるか、あらすじ、台詞、設定構築を書き込みましょう。"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition text-sm text-slate-850"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlotModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-2.5 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
                >
                  エピソードを描き足す✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== プロット詳細表示モーダル ==================== */}
      {viewingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-pink-100 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs bg-pink-100 text-pink-600 px-2.5 py-1 rounded-full font-bold">エピソードプロット📖</span>
              <button
                onClick={() => setViewingPlot(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-3">{viewingPlot.title}</h4>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-80 overflow-y-auto">
              <p className="text-slate-650 text-sm whitespace-pre-wrap leading-relaxed">
                {viewingPlot.content || "説明はありません。これから展開を描き足していきましょう！"}
              </p>
            </div>
            <div className="pt-6 flex justify-end">
              <button
                onClick={() => setViewingPlot(null)}
                className="bg-pink-500 hover:bg-pink-650 text-white font-bold py-2 px-6 rounded-full text-xs transition"
              >
                アトリエを閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 登場人物作成モーダル ==================== */}
      {showCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 border border-indigo-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-user-plus text-indigo-500"></i>
                新しいキャラクターを創り出す
              </h4>
              <button
                onClick={() => setShowCharModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateCharacter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    キャラクター名（必須）
                  </label>
                  <input
                    type="text"
                    required
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="例：ジェミ、ミツキ"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    役割や立場
                  </label>
                  <input
                    type="text"
                    value={newCharRole}
                    onChange={(e) => setNewCharRole(e.target.value)}
                    placeholder="例：主人公、ライバル、導き手"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    年齢
                  </label>
                  <input
                    type="text"
                    value={newCharAge}
                    onChange={(e) => setNewCharAge(e.target.value)}
                    placeholder="例：17、不明"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    外見の特徴
                  </label>
                  <input
                    type="text"
                    value={newCharAppearance}
                    onChange={(e) => setNewCharAppearance(e.target.value)}
                    placeholder="例：青いコート、ストレートのツインテール"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    性格・MBTIなど
                  </label>
                  <input
                    type="text"
                    value={newCharPersonality}
                    onChange={(e) => setNewCharPersonality(e.target.value)}
                    placeholder="例：INFJ、INTJ、気難しいが信頼した相手には優しい"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    登場人物の関係性メモ
                  </label>
                  <input
                    type="text"
                    value={newCharRelation}
                    onChange={(e) => setNewCharRelation(e.target.value)}
                    placeholder="例：○○を応援しており、深く信頼しているパートナー"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  詳細な説明やバックストーリー
                </label>
                <textarea
                  rows={3}
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="キャラクターの過去設定、強み、弱み、物語を通じての目的などを定義します。"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition text-sm text-slate-800"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCharModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-2.5 px-5 rounded-full text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
                >
                  キャラクターを吹き込む✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 登場人物詳細表示モーダル ==================== */}
      {viewingChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl p-6 border border-indigo-100 font-sans">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold">登場人物設定カード🎨</span>
              <button
                onClick={() => setViewingChar(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <span className="text-xs bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded font-bold mr-2">{viewingChar.role || "未設定"}</span>
              {viewingChar.age && <span className="text-xs text-slate-460 font-semibold">{viewingChar.age} 歳</span>}
              <h4 className="text-xl font-bold text-slate-800 mt-2">{viewingChar.name}</h4>
            </div>

            <div className="space-y-4">
              {viewingChar.appearance && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">外見の特徴</span>
                  <p className="text-xs font-semibold text-slate-700">{viewingChar.appearance}</p>
                </div>
              )}
              {viewingChar.personality && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">性格・MBTI</span>
                  <p className="text-xs font-semibold text-slate-700">{viewingChar.personality}</p>
                </div>
              )}
              {viewingChar.relationInfo && (
                <div className="bg-indigo-50/20 rounded-xl p-3 border border-indigo-50/50">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">関係性設定</span>
                  <p className="text-xs font-medium text-indigo-600">{viewingChar.relationInfo}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">詳細設定・背景</span>
                <p className="text-xs text-slate-650 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">{viewingChar.description || "説明はありません。"}</p>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={() => setViewingChar(null)}
                className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold py-2.5 px-6 rounded-full text-xs transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="mt-16 border-t border-slate-100 py-8 bg-white/20">
        <p className="text-center text-xs text-slate-400 font-semibold">
          🎨 Plot Palette &copy; 2026 / Crafted by ジェミ with love 💕
        </p>
      </footer>
    </div>
  );
}
