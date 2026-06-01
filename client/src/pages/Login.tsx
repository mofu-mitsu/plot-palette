import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

/**
 * Login Page - Google OAuth認証
 */

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <i className="fas fa-palette text-4xl text-primary"></i>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Plot Palette
          </h1>
          <p className="text-muted-foreground text-lg">
            小説・漫画のプロット・設定管理ツール
          </p>
        </div>

        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-border/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              ようこそ🎀
            </h2>
            <p className="text-muted-foreground">
              Googleアカウントでログインして、創作を始めましょう✨
            </p>
          </div>

          {/* ログインボタン */}
          <div className="space-y-4">
            <a href={getLoginUrl()} className="block">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold py-6 text-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでログイン
              </Button>
            </a>

            <div className="relative my-2 flex items-center justify-center">
              <span className="absolute bg-white px-3 text-xs text-muted-foreground uppercase">または</span>
              <div className="w-full border-t border-border"></div>
            </div>

            <a href="/api/auth/sandbox" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-primary/30 hover:bg-primary/5 rounded-full font-semibold py-6 text-lg transition-all duration-200 hover:shadow flex items-center justify-center gap-2 text-primary"
              >
                <i className="fas fa-magic text-sm"></i>
                テストユーザーでログイン
              </Button>
            </a>
          </div>

          {/* 説明 */}
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-check-circle text-accent mt-1 flex-shrink-0"></i>
              <div>
                <p className="font-semibold text-foreground">安全なログイン</p>
                <p className="text-sm text-muted-foreground">
                  Googleアカウントで安全に認証されます
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <i className="fas fa-lock text-accent mt-1 flex-shrink-0"></i>
              <div>
                <p className="font-semibold text-foreground">プライベート</p>
                <p className="text-sm text-muted-foreground">
                  あなたのデータは完全に保護されます
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <i className="fas fa-cloud text-accent mt-1 flex-shrink-0"></i>
              <div>
                <p className="font-semibold text-foreground">クラウド同期</p>
                <p className="text-sm text-muted-foreground">
                  どのデバイスからでもアクセス可能
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            💕 あなたの創作を応援します 💕
          </p>
        </div>
      </div>
    </div>
  );
}
