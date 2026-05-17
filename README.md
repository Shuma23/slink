# SLINK

Next.js App Router / Clerk / Supabase PostgreSQL で実装した短縮リンク管理サービスです。短縮URL、クリック計測、A/Bテスト、QRコード、OGPプレビュー、ラベル、アーカイブ、プロフィールリンクページを扱えます。

## Stack

- Next.js 16 App Router / TypeScript
- Tailwind CSS v4
- shadcn/ui style components
- Clerk authentication
- Supabase PostgreSQL + RLS
- Supabase JS
- QR code generation
- Recharts analytics
- Vercel deployment

## Setup

1. 依存関係をインストールします。

```bash
npm install
```

2. `.env.example` をもとに `.env.local` を作成します。

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3003
IP_HASH_SALT=
```

3. Clerk の Google OAuth を有効化します。Facebook / Twitter は Clerk Dashboard の Social Connections を追加すれば拡張できます。

4. Clerk の `Connect with Supabase` から Supabase compatibility を有効化し、Supabase 側で Clerk を Third-Party Auth provider として追加します。Supabase 側では Clerk session token の `sub` を `auth.jwt() ->> 'sub'` として RLS で参照します。

5. Supabase SQL editor で [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql) を実行します。

6. 開発サーバーを起動します。

```bash
npm run dev
```

## Security Notes

- `/dashboard/*`、`/links/*`、`/settings/*`、`/api/ogp` は `src/proxy.ts` の `clerkMiddleware()` と `auth.protect()` で保護しています。
- Server Actions はすべて `auth.protect()` を呼び、Clerk `userId` を `user_id` として保存します。
- Supabase RLS は `user_id = auth.jwt() ->> 'sub'` を基準に、ユーザー自身のデータだけを許可します。
- Clerk + Supabase は旧 JWT Template 方式ではなく、Supabase Third-Party Auth 方式の Clerk session token を使います。
- 公開リダイレクトは未ログインアクセスが必要なため、`SUPABASE_SERVICE_ROLE_KEY` をサーバー側のみに閉じ込めています。
- URL は `http:` / `https:` のみ許可し、slug は英数字・ハイフン・アンダースコアのみ許可します。
- IP は `IP_HASH_SALT` と SHA-256 でハッシュ化して保存します。

## Routes

- `/` サービスLP
- `/sign-in` custom Clerk-powered login page
- `/sign-up` redirects to `/sign-in` while public sign-up is closed
- `/dashboard` analytics overview
- `/dashboard/links` link list, search, label filter, archive toggle
- `/dashboard/links/new` link creation
- `/dashboard/links/[id]` edit, analytics, A/B test, QR, OGP
- `/dashboard/labels` label management
- `/dashboard/pages`, `/dashboard/pages/new` profile landing pages
- `/dashboard/settings` account settings
- `/s/[slug]`, `/t/[slug]`, `/p/[slug]` redirect routes

`/p/[slug]` は同じ slug の短縮リンクが存在する場合はリダイレクトを優先し、存在しない場合は landing page を公開HTMLとして返します。

## Vercel Deployment

1. Vercel に GitHub リポジトリを接続します。
2. Project Settings の Environment Variables で Production / Preview / Development ごとに値を設定します。
3. `NEXT_PUBLIC_` には公開してよい値だけを入れてください。`CLERK_SECRET_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`IP_HASH_SALT` は秘密情報です。
4. Production の `NEXT_PUBLIC_APP_URL` は本番URLに変更します。
5. Clerk Dashboard の allowed redirect URLs / allowed origins に Vercel の Production / Preview URL を追加します。
6. Supabase SQL migration を本番プロジェクトに適用してからデプロイします。

## Verification Checklist

- [ ] 未ログインで `/dashboard` にアクセスすると Clerk にリダイレクトされる
- [ ] Google ログインで `/dashboard` に戻れる
- [ ] `/dashboard/links/new` で `https://` URLの短縮リンクを作成できる
- [ ] `javascript:` や `data:` の URL が拒否される
- [ ] 同じ `path_type + slug` の重複作成が拒否される
- [ ] `/s/[slug]`、`/t/[slug]`、`/p/[slug]` が元URLへリダイレクトする
- [ ] クリック後に `click_events` に user agent / referrer / country / device 情報が保存される
- [ ] 無効化またはアーカイブ済みリンクが 404 になる
- [ ] リンク詳細で日別クリック、デバイス別表示が見える
- [ ] A/Bテストの遷移先を最大10件まで追加できる
- [ ] QRコードのサイズ・色変更、PNG / SVG ダウンロードが動く
- [ ] OGP取得、手動編集、プレビュー、保存が動く
- [ ] ラベル作成、リンクへの付与、一覧フィルタが動く
- [ ] アーカイブと復元が動く
- [ ] ランディングページを作成し、`/p/[slug]` で表示できる
- [ ] モバイル幅でフォーム、カード、テーブルが崩れない

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
```

## Official Docs Referenced

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Clerk Next.js auth()](https://clerk.com/docs/reference/nextjs/app-router/auth)
- [Clerk clerkMiddleware()](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk Supabase integration](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
