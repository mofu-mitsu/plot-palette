import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Palette, CheckCircle2, Lock, Cloud, Edit3 } from "lucide-react";

/**
 * Login Page - Google OAuth認証
 */

export default function Login() {
  return (
    <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-50 rounded-full mb-6 shadow-sm border-[3px] border-pink-500">
            <Palette className="w-10 h-10 text-pink-400" />
          </div>
          <h1 className="text-4xl font-bold text-pink-500 mb-2 tracking-tight flex items-center justify-center gap-2">
            Plot Palette
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            小説・漫画のプロット・設定管理ツール
          </p>
        </div>

        {/* メインカード */}
        <div className="bg-white rounded-[24px] shadow-sm p-10 border border-slate-200">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 flex items-center justify-center gap-2">
              ようこそ <span className="text-2xl">🎀</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Googleアカウントでログインして、創作を始めましょう<span className="text-amber-500">✨</span>
            </p>
          </div>

          {/* ログインボタン */}
          <div className="space-y-4">
            <a href={getLoginUrl()} className="block">
              <Button
                size="lg"
                className="w-full bg-white hover:bg-pink-50 text-pink-600 border-2 border-pink-500 rounded-full font-bold py-6 text-base transition-all duration-200 shadow-sm flex items-center justify-center gap-3"
              >
                <div className="w-5 h-5 flex items-center justify-center text-white font-bold bg-pink-500 rounded-full text-xs">G</div>
                Googleでログイン
              </Button>
            </a>

            <div className="relative my-4 flex items-center justify-center">
              <span className="absolute bg-white px-3 text-xs text-slate-400 font-medium">または</span>
              <div className="w-full border-t border-slate-200"></div>
            </div>

            <a href="/api/auth/sandbox" className="block">
              <Button
                size="lg"
                className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-800 rounded-2xl font-bold py-6 text-base transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                テストユーザーでログイン
              </Button>
            </a>
          </div>

          {/* 説明 */}
          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-slate-800 mt-0.5 flex-shrink-0" fill="currentColor" opacity="0.1" strokeWidth={1.5} />
              <div className="relative">
                <CheckCircle2 className="w-5 h-5 text-slate-800 absolute -left-8 top-0.5 flex-shrink-0" />
                <p className="font-bold text-slate-800 text-sm">安全なログイン</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Googleアカウントで安全に認証されます
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-slate-800 mt-0.5 flex-shrink-0" fill="currentColor" opacity="0.1" strokeWidth={1.5} />
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-800 absolute -left-8 top-0.5 flex-shrink-0" />
                <p className="font-bold text-slate-800 text-sm">プライベート</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  あなたのデータは完全に保護されます
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 text-slate-800 mt-0.5 flex-shrink-0" fill="currentColor" opacity="0.1" strokeWidth={1.5} />
               <div className="relative">
                <Cloud className="w-5 h-5 text-slate-800 absolute -left-8 top-0.5 flex-shrink-0" />
                <p className="font-bold text-slate-800 text-sm">クラウド同期</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  どのデバイスからでもアクセス可能
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-8">
          <p className="text-[11px] text-slate-600 font-bold tracking-wider">
            💕 あなたの創作を応援します 💕
          </p>
        </div>
      </div>
    </div>
  );
}
