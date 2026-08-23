# Firebase静的ミラー: GitHub OIDC連携設定 V1

制定日: 2026-08-23
対象: `motookoyama/IZAKAYA_verse1.5` → `izakaya-commercial-sandbox` のFirebase Hosting
状態: **準備済み / Google IAMの最小権限設定待ち**

## 0. この方式を選ぶ理由

Firebase CLI標準の `hosting:github` 初期化は、長期有効なサービスアカウント鍵をGitHub Secretsへ保存し、Hosting以外も含む広い権限を自動で与える。IZAKAYAの商業・コスト原則に合わないため採用しない。

代わりにGitHub Actionsが実行される瞬間だけGoogle Cloudへ認証するOIDC / Workload Identity Federation（WIF）を使う。GitHubへGCP鍵を保存しない。

## 1. 現在地

- Firebase Hostingは初期化済み。静的ミラー用の標準URLは発行済み。
- リリースは0件。Firebase側へIZAKAYAコンテンツはまだ配置していない。
- GitHub OAuthによるFirebase CLI認可は通ったが、標準連携が求める長期鍵・GitHub Secret・広い権限は作成していない。
- `.github/workflows/firebase-hosting-manual.yml` は手動実行専用である。mainへのpushだけでは実行されない。

## 2. Google Cloud側で一度だけ作るもの

| もの | 用途 | 制限 |
| --- | --- | --- |
| Workload Identity Pool | GitHub Actionsからの一時認証の受け皿 | `global`、IZAKAYA専用 |
| GitHub OIDC Provider | GitHubの公式発行者を確認 | issuer は `https://token.actions.githubusercontent.com` |
| Hosting deployerサービスアカウント | Firebase Hostingへ静的ファイルだけを出す | `roles/firebasehosting.admin` だけから開始 |
| Workload Identity User結合 | 対象リポジトリだけが上記アカウントを一時利用 | repository を `motookoyama/IZAKAYA_verse1.5` に限定 |

禁止: JSON鍵の発行、GitHub Secretsへの鍵保存、Auth Admin / Functions Developer / Firestore書込権限の付与、PayPal・BFFへの権限付与。

## 3. 信頼条件

Providerの属性には少なくとも次を入れる。

- `google.subject=assertion.sub`
- `attribute.repository=assertion.repository`
- `attribute.repository_id=assertion.repository_id`

属性条件は、対象リポジトリID `1116311140` に限定する。リポジトリ名が変わっても他リポジトリを信頼しないためである。

さらに、サービスアカウントの `roles/iam.workloadIdentityUser` は当該Providerの上記リポジトリ属性だけへ与える。ブランチを自動公開へ広げるまでは、GitHub workflow の手動実行だけを許可する。

## 4. GitHub側に置く非秘密値

Google側の作成後、リポジトリVariablesへ次だけを登録する。

| Variable | 値 |
| --- | --- |
| `IZAKAYA_FIREBASE_WIF_PROVIDER` | `projects/<project-number>/locations/global/workloadIdentityPools/<pool>/providers/<provider>` |
| `IZAKAYA_FIREBASE_WIF_SERVICE_ACCOUNT` | `<service-account>@izakaya-commercial-sandbox.iam.gserviceaccount.com` |

どちらも鍵ではない。Google CloudサービスアカウントJSON、PayPal情報、カード情報、APIキーをGitHubへ置かない。

## 5. 運用順序

1. Google Cloud側のWIFを最小権限で作る（オーナー承認時のみ）。
2. 上記VariablesをGitHubへ登録する。
3. mainへこのworkflowを反映する。自動デプロイは始まらない。
4. オーナーがGitHub Actionsの手動実行画面で `owner_approved` を明示して、初回の静的ミラーを出す。
5. Firebase URLで見た目・ルート・BFF未接続・決済未開始を確認する。
6. 安定後にだけ、mainへの自動反映を別承認で検討する。

## 6. 成功判定

```text
STATIC_MIRROR_WIF
- GitHubに長期GCP鍵なし
- 対象リポジトリ以外は認証不可
- workflowは手動承認なしに実行不可
- deploy対象は --only hosting
- BFF / Firestore / PayPal / points: NOT TOUCHED
- Firebase Hosting release: owner-approved static content only
```

参考: Google公式の `google-github-actions/auth` は、長期鍵の代わりにWIFを推奨している。GitHub公式もOIDCによる短期トークン利用を案内している。
