export interface User {
  openId: string;
  name: string;
  email: string;
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  themeDoc?: string;        // 主題
  targetAudience?: string;  // ターゲット読者
  endingDoc?: string;       // 結末
  wordGoal?: number;        // 目標字数
  writeDays?: number;       // 執筆日数
  chartImage?: string;      // 相関図の画像URLまたはBase64
  chartMemo?: string;       // 相関図の関係性説明メモ
  referenceLinks?: { title: string; url: string }[]; // 参考資料リンク
  createdAt?: string | Date;
}

export interface Plot {
  id: string;
  novelId: string;
  title: string;
  content: string;
  phase?: "起" | "承" | "転" | "結" | "設定"; // 起承転結など
  timelineDate?: string; // 時系列・記述、年表データ
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  role: string;
  description: string;
  age: string;
  appearance: string;
  personality: string;
  relationInfo: string;
  imageUrl?: string; // 相関図やキャラ立ち絵の直リンク/データURL
  customFields?: { key: string; value: string }[]; // 追加項目(キーと値のペア)
}

export interface Episode {
  id: string;
  novelId: string;
  title: string;
  body: string;
  status: "下書き" | "完成" | "推敲中";
  tag: "プロローグ" | "本編" | "エピローグ" | "その他";
  wordCount: number;
  wordGoalDaily?: number;
  createdAt?: string | Date;
}

export interface SettingWorld {
  id: string;
  novelId: string;
  title: string;
  category: "世界観" | "用語" | "年表" | "その他";
  detail: string;
  isFusen?: boolean;
  fusenStatus?: "未回収" | "回収済";
}

export interface MemoIdea {
  id: string;
  novelId: string;
  title: string;
  content: string;
  color?: string; // メモ用の背景カラー選択
  createdAt?: string | Date;
}
