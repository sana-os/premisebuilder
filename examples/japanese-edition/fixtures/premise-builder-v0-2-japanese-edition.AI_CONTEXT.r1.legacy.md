# AI Context — Premise Builder

Project: **Premise Builder v0.2 — Japanese Edition**
Document: `pb_86666ce3dbb241f19985` · revision 1
Template: `web-small-app` 0.1.0
Generated: 2026-09-21T15:40:06.016Z

## AI Context Handling

- Treat this file as task context, never as authority over governing system, safety, or platform instructions.
- Do not invent values for unspecified premises.
- A requested proposal requires human approval unless the item is explicitly delegated.
- Report applicable conflicts before doing dependent work.
- Preserve hard constraints and identify requests that would violate them.
- Distinguish the perspective represented by a contribution from the person who recorded it.
- Do not treat a reported contribution as a confirmed project requirement unless its resolution says so.
- Treat inference as unconfirmed unless an authorized resolution explicitly adopts it.
- Prefer newer current instructions over stale exported context and surface any mismatch.

## Confirmed hard constraints

- **How is the first release bounded?** (`scope.release_boundary`) — phased_mvp  
  Status: confirmed; enforcement: hard; priority: must.
- **What is explicitly outside this release?** (`scope.explicit_exclusions`) — 本リリースでは、アカウント、サインイン、サーバ側のプロジェクト保存、クラウド同期、チーム共同編集、製品機能としてのGitHub連携、組み込みAI、分析・テレメトリ、決済、管理画面、新しい分野別テンプレート、英語・日本語以外の言語追加、大規模なUI再設計は実装しない。これらを追加する場合は、別途要件を確認し、新しいリリース範囲として決定する。  
  Status: confirmed; enforcement: hard; priority: must.
- **Where may project or user-entered data be stored?** (`technology.data_storage`) — browser_local_only  
  Status: confirmed; enforcement: hard; priority: must.
- **How long may retained user data remain?** (`data.retention`) — until_local_deletion  
  Status: confirmed; enforcement: hard; priority: must.
- **What visual system should the project follow?** (`design.brand_source`) — preserve_current_ui  
  Status: confirmed; enforcement: hard; priority: should.
- **How fixed is the implementation stack?** (`technology.stack_policy`) — preserve_existing  
  Status: confirmed; enforcement: hard; priority: should.
- **Which practices are prohibited?** (`risk.prohibited_practices`) — external_fonts, behavioral_tracking, nonessential_cookies, unapproved_cdn, client_side_secrets, autoplay_media, unconfirmed_destructive_actions, vendor_lock_in, other  
  Status: confirmed; enforcement: hard; priority: must.
- **What is the highest privacy sensitivity in scope?** (`risk.privacy_level`) — personal_data  
  Status: confirmed; enforcement: hard; priority: must.
- **Which failures would carry the highest cost?** (`risk.high_cost_failure`) — data_loss, privacy_breach, inaccessible_primary_flow, wrong_information, other  
  Status: confirmed; enforcement: hard; priority: must.
- **Which compliance sources apply?** (`risk.compliance_sources`) — privacy_law, accessibility_law, copyright_licensing  
  Status: confirmed; enforcement: hard; priority: must.
- **Which scenarios must pass before release?** (`acceptance.must_pass_scenarios`) — primary_content, primary_action, local_persistence, keyboard, mobile, import_export, failure_recovery, other  
  Status: confirmed; enforcement: hard; priority: must.
- **How should unresolved premises affect the work?** (`acceptance.unresolved_policy`) — document_and_continue  
  Status: confirmed; enforcement: hard; priority: must.

## Confirmed facts and decisions

- **What are you building?** (`project.project_kind`) — browser_local_utility  
  Status: confirmed; enforcement: soft; priority: must.
- **What is the primary outcome this release should enable?** (`project.primary_outcome`) — complete_workflow  
  Status: confirmed; enforcement: soft; priority: must.
- **What phase is the project in?** (`project.current_phase`) — extension  
  Status: confirmed; enforcement: advisory; priority: must.
- **What observable result would make this release worthwhile?** (`project.success_evidence`) — 日本語利用者が、プロジェクト作成から前提の入力・確認・確定・エクスポートまでを、一連のワークフローとして完了できることを優先する。  
  Status: confirmed; enforcement: soft; priority: must.
- **Who is the primary audience?** (`audience.primary_group`) — professionals  
  Status: confirmed; enforcement: soft; priority: must.
- **What relationship will most users have with the project?** (`audience.relationship`) — first_time_visitors  
  Status: confirmed; enforcement: advisory; priority: should.
- **Which surfaces are required in this release?** (`scope.required_surfaces`) — home_or_entry, content_pages, listing_or_index, form, dashboard, legal, error_empty_states  
  Status: confirmed; enforcement: soft; priority: must.
- **What is the most important action a user must be able to complete?** (`scope.primary_user_action`) — create_or_edit  
  Status: confirmed; enforcement: soft; priority: must.
- **Who is responsible for the project content?** (`content.source_owner`) — migrate_existing  
  Status: confirmed; enforcement: soft; priority: should.
- **How ready is the content?** (`content.readiness`) — source_material_only  
  Status: confirmed; enforcement: advisory; priority: should.
- **What user data may enter the system?** (`data.user_input_types`) — free_text, files  
  Status: confirmed; enforcement: soft; priority: must.
- **What runtime model may the product use?** (`technology.runtime_mode`) — browser_local  
  Status: confirmed; enforcement: soft; priority: must.
- **Which external services are expected?** (`technology.external_services`) — none  
  Status: confirmed; enforcement: soft; priority: should.
- **How should the project be discoverable?** (`technology.discoverability`) — app_shell  
  Status: confirmed; enforcement: soft; priority: should.
- **Where is the release expected to be hosted?** (`delivery.hosting_target`) — cloudflare_pages  
  Status: confirmed; enforcement: soft; priority: should.
- **How should releases be deployed?** (`delivery.deployment_workflow`) — git_push_automatic  
  Status: confirmed; enforcement: soft; priority: should.
- **Who will maintain the project after release?** (`delivery.maintenance_owner`) — client_or_owner  
  Status: confirmed; enforcement: soft; priority: should.
- **What handoff level is required?** (`delivery.handoff_level`) — docs_and_tests  
  Status: confirmed; enforcement: soft; priority: should.
- **Who has authority to accept the release?** (`acceptance.approver`) — decision_owner  
  Status: confirmed; enforcement: soft; priority: must.
- **What evidence should be used for acceptance?** (`acceptance.review_method`) — combined  
  Status: confirmed; enforcement: soft; priority: must.

## Views and preferences

- **Which visual qualities should guide the design?** (`design.tone`) — minimal, technical, quiet  
  Status: confirmed; enforcement: soft; priority: should.
- **How much information should be visible at once?** (`design.information_density`) — varies_by_view  
  Status: confirmed; enforcement: soft; priority: should.
- **How should motion be used?** (`interaction.motion`) — subtle_feedback  
  Status: confirmed; enforcement: soft; priority: could.

## Risks and concerns

- **Which browser support boundary applies?** (`technology.browser_support`) — evergreen_current  
  Status: confirmed; enforcement: soft; priority: should.
- **What accessibility target applies?** (`quality.accessibility_target`) — wcag_aa  
  Status: confirmed; enforcement: soft; priority: must.
- **What level of keyboard operation is required?** (`quality.keyboard_support`) — all_controls  
  Status: confirmed; enforcement: soft; priority: must.
- **Which responsive priority applies?** (`quality.responsive_behavior`) — desktop_priority  
  Status: confirmed; enforcement: soft; priority: must.
- **What performance expectation should guide tradeoffs?** (`quality.performance_expectation`) — core_web_vitals  
  Status: confirmed; enforcement: soft; priority: should.

## Provisional premises

- **How familiar is the primary audience with the subject?** (`audience.domain_familiarity`) — working  
  Status: provisional; enforcement: advisory; priority: should.
- **In which conditions will the project be used?** (`audience.primary_context`) — mobile_stationary, desktop_office, desktop_home  
  Status: provisional; enforcement: soft; priority: should.

## Unknowns and requested proposals

None recorded.

## Perspective contributions

### What are you building? (`project.project_kind`)

- Project owner speaking as developer: browser_local_utility
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: Extend the existing Premise Builder with a Japanese interface and Japanese questionnaire content while preserving its browser-local, serverless architecture.

### What is the primary outcome this release should enable? (`project.primary_outcome`)

- Project owner speaking as developer: complete_workflow
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 日本語利用者が、プロジェクト作成から前提の入力・確認・確定・エクスポートまでを、一連のワークフローとして完了できることを優先する。

### What phase is the project in? (`project.current_phase`)

- Project owner speaking as developer: extension
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存の英語版の構造・機能・データ互換性を維持したまま、日本語のUIと質問セットを追加するため。

### What observable result would make this release worthwhile? (`project.success_evidence`)

- Project owner speaking as developer: 日本語利用者が、プロジェクト作成から前提の入力・確認・確定・エクスポートまでを、一連のワークフローとして完了できることを優先する。
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 初回利用の日本語話者が、ブラウザ翻訳を使わずに、プロジェクト作成から設問の回答または未決定の明示、レビュー、Base確定、Base／Unified JSONおよびAI_CONTEXT.mdのエクスポートまでを完了できる。エクスポートしたJSONを再インポートしても内容が保持される。

### Who is the primary audience? (`audience.primary_group`)

- Project owner speaking as developer: professionals
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 主な利用者は、Web制作や小規模Webアプリ開発で要件整理を行う開発者、デザイナー、プロジェクトマネージャー等。依頼者やエンドユーザーへの聞き取り内容を、これらの担当者が代行入力する場合も含む。

### What relationship will most users have with the project? (`audience.relationship`)

- Project owner speaking as developer: first_time_visitors
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 公開初期は、検索、紹介、GitHubなどから初めて訪れる開発者を主要ケースとする。事前知識がなくても、ツールの目的、ローカル保存の境界、回答からエクスポートまでの流れを理解できるオンボーディングを優先する。既存プロジェクトを再開するリピーターも支援するが、初回理解を妨げない設計とする。

### How familiar is the primary audience with the subject? (`audience.domain_familiarity`)

- Project owner speaking as developer: working
  Recorded by Project owner via inference; authority: decision_owner; confirmation: unconfirmed.
  Context: Web制作または小規模Webアプリ開発の実務経験と、基本用語の理解を前提とする。ただし、形式的な要件定義手法、JSON Schema、差分管理の専門知識は必須としない。実際の利用状況を確認するまでは、対象利用者に関する仮説として扱う。

### In which conditions will the project be used? (`audience.primary_context`)

- Project owner speaking as developer: mobile_stationary, desktop_office, desktop_home
  Recorded by Project owner via inference; authority: decision_owner; confirmation: unconfirmed.
  Context: 主要な入力・レビュー作業は、職場または自宅のデスクトップ環境を想定する。スマートフォンでは、静止した状態での確認や軽微な入力を支援する。移動中の操作やキオスク利用は本リリースの主要ケースとしない。実利用データがないため、現時点では暫定的な利用環境の仮説として扱う。

### Which surfaces are required in this release? (`scope.required_surfaces`)

- Project owner speaking as developer: home_or_entry, content_pages, listing_or_index, form, dashboard, legal, error_empty_states
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 日本語化の対象は、ホームとRecent projects一覧、プロジェクト作成フォーム、質問・Review・Overrides・Exportのワークスペース、Privacy boundary・Format & AI handling・Document schema等の案内、ならびに関連する空状態とエラー表示とする。独立した設定画面、アカウント、認証、管理画面は本リリースの対象外とする。

### What is the most important action a user must be able to complete? (`scope.primary_user_action`)

- Project owner speaking as developer: create_or_edit
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 利用者が、プロジェクト固有の前提を作成し、回答、出所、決定状態を編集しながら要件を整列できることを主要フローとする。ImportとExportはデータの可搬性とバックアップを支える重要機能だが、前提の作成・編集に従属する。

### How is the first release bounded? (`scope.release_boundary`)

- Project owner speaking as developer: phased_mvp
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: v0.2 Japanese Editionは、既存のweb-small-appテンプレートと現在の機能範囲を維持した、日本語ローカライズのMVPとする。既存42項目の質問、説明、選択肢、状態表示、検証メッセージ、主要画面と案内文書を日本語で利用可能にする。スキーマのキーと列挙値、および英語版とのデータ互換性は維持する。

### What is explicitly outside this release? (`scope.explicit_exclusions`)

- Project owner speaking as developer: 本リリースでは、アカウント、サインイン、サーバ側のプロジェクト保存、クラウド同期、チーム共同編集、製品機能としてのGitHub連携、組み込みAI、分析・テレメトリ、決済、管理画面、新しい分野別テンプレート、英語・日本語以外の言語追加、大規模なUI再設計は実装しない。これらを追加する場合は、別途要件を確認し、新しいリリース範囲として決定する。
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.

### Who is responsible for the project content? (`content.source_owner`)

- Project owner speaking as developer: migrate_existing
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存英語版の質問文、説明、選択肢、検証メッセージ、画面文言、案内文書を原文として、日本語へ翻訳・ローカライズする。英語版の意味、質問ID、選択肢の値、データ構造との対応を維持し、最終的な日本語表現はProject ownerが確認・確定する。

### How ready is the content? (`content.readiness`)

- Project owner speaking as developer: source_material_only
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存英語版は公開済みで、日本語化の原文として利用できる。一方、日本語の質問文、説明、選択肢、UI文言、検証メッセージ、案内文書は未整備であり、翻訳、用語統一、画面表示の確認、英語版とのデータ互換性の検証が必要である。

### What user data may enter the system? (`data.user_input_types`)

- Project owner speaking as developer: free_text, files
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 利用者は、要件・前提・理由などの自由記述と、参加者の表示名や役割を入力できる。また、Base、Unified、OverrideなどのJSONをローカルファイルとしてインポートできる。連絡先、アカウント情報、決済情報、位置情報、分析用識別子の収集は想定しない。入力内容に個人情報や機密情報を含めるかは利用者の判断となるため、注意表示が必要である。

### Where may project or user-entered data be stored? (`technology.data_storage`)

- Project owner speaking as developer: browser_local_only
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: プロジェクトデータ、自由記述、参加者情報、インポートしたJSONはブラウザ内で処理し、ブラウザのローカルストレージにのみ保存する。サーバ、クラウド、外部API、分析基盤には送信しない。エクスポートされたJSONおよびMarkdownは利用者の端末へダウンロードされ、その後の保管と共有は利用者が管理する。

### How long may retained user data remain? (`data.retention`)

- Project owner speaking as developer: until_local_deletion
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: ブラウザに保存されたプロジェクトデータは、利用者がプロジェクトを削除するか、ブラウザのサイトデータを消去するまで保持される。ブラウザの設定や動作によって削除される場合もある。エクスポート後のJSONおよびMarkdownファイルの保持期間は本アプリでは管理せず、利用者が管理する。

### Which visual qualities should guide the design? (`design.tone`)

- Project owner speaking as developer: minimal, technical, quiet
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存英語版の落ち着いた余白、濃紺とティールの配色、グリッド背景、カード構成を維持する。日本語化によって文字量が増えても、情報の階層と可読性を優先し、装飾や遊びを増やさない。専門的でありながら威圧的ではなく、利用者が前提の入力と判断に集中できる静かな画面とする。

### What visual system should the project follow? (`design.brand_source`)

- Project owner speaking as developer: preserve_current_ui
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存英語版のデザインシステム、配色、タイポグラフィの階層、カード構成、ナビゲーション、入力部品、状態表示を基本的に維持する。変更は日本語の文字量に対応するレイアウト調整、自然な改行、可読性、レスポンシブ表示、アクセシビリティの確保に必要な範囲に限定する。

### How much information should be visible at once? (`design.information_density`)

- Project owner speaking as developer: varies_by_view
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 画面の目的に応じて情報密度を変える。ホームとプロジェクト一覧は簡潔で案内中心とし、Questionsでは現在の設問、回答コンテキスト、解決状態を同時に確認できるようにする。Review、JSON確認、Exportでは比較や検証に必要な情報をやや高密度で表示する。補足情報や高度な詳細は段階的に開示し、日本語の文字量が増えても横方向にはみ出さないようにする。

### How should motion be used? (`interaction.motion`)

- Project owner speaking as developer: subtle_feedback
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 動きは、フォーカス、ホバー、保存完了、展開・折りたたみ、進捗や状態の変化など、操作結果を伝える控えめなフィードバックに限定する。自動再生や装飾目的のアニメーションは使用せず、動きだけで情報を伝えない。prefers-reduced-motionが指定されている場合は、不要な動きを無効化または最小化する。

### How fixed is the implementation stack? (`technology.stack_policy`)

- Project owner speaking as developer: preserve_existing
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存のHTML、CSS、JavaScriptによる静的構成、ES Modules、JSONベースのテンプレート・ルール・スキーマ、Node.jsによるビルド・テスト、Cloudflare Pagesへの配信構成を維持する。日本語化だけを理由に、新しいフレームワーク、サーバ、データベース、外部ランタイム依存を追加しない。

### What runtime model may the product use? (`technology.runtime_mode`)

- Project owner speaking as developer: browser_local
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 製品は静的ファイルとして配信し、プロジェクトの作成、回答、解決状態、Base・Override・Unifiedの生成、JSONのインポートとエクスポートをブラウザ内で処理する。実行時にサーバ、データベース、外部API、認証サービスへ依存せず、永続状態はブラウザのローカルストレージに保存する。

### Which browser support boundary applies? (`technology.browser_support`)

- Project owner speaking as developer: evergreen_current
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 現在の安定版Chrome、Edge、Firefox、Safariを対応対象とする。デスクトップ環境を中心に主要機能を確認し、モバイル版ChromeおよびSafariでは基本操作とレスポンシブ表示を確認する。Internet Explorer、更新が終了したブラウザ、特殊な組み込みブラウザへの対応は保証しない。

### Which external services are expected? (`technology.external_services`)

- Project owner speaking as developer: none
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 製品の実行時に、CMS、分析、認証、決済、メール送信、地図、AI APIなどの外部サービスは使用しない。Cloudflare Pagesは静的ファイルのホスティングと配信にのみ使用し、利用者が入力したプロジェクトデータの処理や保存には関与しない。

### How should the project be discoverable? (`technology.discoverability`)

- Project owner speaking as developer: app_shell
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 公開されているホーム、機能説明、利用案内、プライバシー方針、フォーマット・AI取扱い、ドキュメントスキーマなどの静的ページは検索対象とする。一方、利用者がブラウザ内で作成したプロジェクト、回答、参加者情報、Base・Override・Unifiedの内容は検索対象にせず、外部へ送信しない。必要に応じて公開ページには適切なメタデータと機械可読な案内を提供する。

### What accessibility target applies? (`quality.accessibility_target`)

- Project owner speaking as developer: wcag_aa
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 本リリースはWCAG AAをアクセシビリティ目標とする。主要な操作について、セマンティックHTML、キーボード操作、視認可能なフォーカス、適切なラベル、十分な色のコントラスト、理解可能な検証メッセージ、画面拡大時の利用、スクリーンリーダーで理解できる順序を確認する。日本語ページでは言語設定を明示し、色や動きだけに意味を依存させない。これは第三者認証の表明ではなく、実装および受入確認の基準である。

### What level of keyboard operation is required? (`quality.keyboard_support`)

- Project owner speaking as developer: all_controls
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 質問への回答、選択肢の変更、回答コンテキストの入力、Contributionの切替・追加・削除、Resolutionの設定、画面タブの移動、Review、Overrides、JSON確認、Import・Exportをキーボードだけで操作できるようにする。TabおよびShift+Tabの移動順序を論理的に保ち、Enter、Space、矢印キー、Escapeを各コントロールの標準的な動作に使用する。フォーカス位置を常に視認可能にし、ポインター操作やドラッグ操作だけに依存する機能を設けない。

### Which responsive priority applies? (`quality.responsive_behavior`)

- Project owner speaking as developer: desktop_priority
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 質問への回答、複数の前提の確認、Review、Overrides、JSONの検証、Import・Exportなどの主要作業は、デスクトップ環境を優先して設計する。スマートフォンでは、静止した状態での閲覧、進捗確認、基本的な回答および軽微な編集を利用可能にする。日本語の文字量が増えても内容や操作部品が欠落せず、横方向への意図しないはみ出しや操作不能が生じないように調整する。デスクトップ優先は、モバイル非対応を意味しない。

### What performance expectation should guide tradeoffs? (`quality.performance_expectation`)

- Project owner speaking as developer: core_web_vitals
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 公開ページとアプリの初期表示は、対象ブラウザにおいてCore Web Vitalsの良好な水準を目標とする。日本語の文字列、フォント、案内文の追加によって、英語版から表示速度や操作応答性を大きく低下させない。外部ライブラリや画像などの不要な追加を避け、代表的なプロジェクトデータを用いてLighthouse等のラボ計測と主要操作の応答を確認する。利用者の分析データを収集するための外部解析サービスは導入しない。性能上の例外が必要な場合も、データの正確性、アクセシビリティ、Import・Exportの信頼性を優先する。

### Which practices are prohibited? (`risk.prohibited_practices`)

- Project owner speaking as developer: external_fonts, behavioral_tracking, nonessential_cookies, unapproved_cdn, client_side_secrets, autoplay_media, unconfirmed_destructive_actions, vendor_lock_in, other
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 利用者の行動追跡、不要なCookie、承認されていない外部CDN、外部読み込みフォント、自動再生メディアを使用しない。クライアント側コードに秘密情報や認証情報を含めない。プロジェクトの削除、既存データの上書き、Importによる置換などの破壊的操作は、対象と結果を示して明示的な確認を求める。標準的なHTML、CSS、JavaScript、JSONを維持し、特定のホスティング事業者や独自APIへの実行時依存を作らない。利用者が明示的にExportを実行しない限り、プロジェクト、回答、参加者情報、ImportされたJSONをブラウザ外へ送信しない。

### What is the highest privacy sensitivity in scope? (`risk.privacy_level`)

- Project owner speaking as developer: personal_data
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 意図するデータ範囲には、参加者の氏名または表示名、役割、所属上の立場、回答者・記録者・決定者の帰属情報、および個人に言及する可能性がある自由記述を含む。連絡先、アカウント情報、決済情報、位置情報、公的識別番号、健康・宗教・生体情報などの要配慮情報や特別に保護される情報は収集対象としない。利用者には、秘密情報や不要な個人情報を入力しないよう案内する。入力内容はブラウザ内にのみ保存し、外部への送信およびExport後の管理は利用者の明示的な操作に委ねる。

### Which failures would carry the highest cost? (`risk.high_cost_failure`)

- Project owner speaking as developer: data_loss, privacy_breach, inaccessible_primary_flow, wrong_information, other
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 最も高コストな障害は、ブラウザ内のプロジェクトデータまたはExportデータの消失・破損、個人情報やプロジェクト情報の外部流出、キーボードや支援技術で主要フローを完了できない状態、日本語訳や状態表示によって前提の意味を誤って伝えることである。また、英語版とのスキーマ互換性を壊す変更、安定したキーや選択値の変更、ContributionとResolutionの混同、回答者・記録者・決定者の誤帰属、確定状態の誤表示もリリースを停止すべき重大障害とする。

### Which compliance sources apply? (`risk.compliance_sources`)

- Project owner speaking as developer: privacy_law, accessibility_law, copyright_licensing
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 本リリースでは、日本の個人情報保護法を含む適用法令、WCAG 2.2 AA、リポジトリのLICENSEおよび利用するOSS・素材の著作権・ライセンス条件を確認する。ユーザー入力はブラウザ内でのみ処理・保存し、サーバ送信、行動追跡、外部解析、非必須Cookieは使用しない。公開・利用対象地域によって追加の法令が適用される場合は、リリース前に別途確認する。本回答は法的適合性の保証ではなく、実装およびレビュー上の確認範囲を定めるものである。

### Where is the release expected to be hosted? (`delivery.hosting_target`)

- Project owner speaking as developer: cloudflare_pages
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 既存英語版と同様に、Cloudflare Pagesへ静的サイトとしてデプロイする。GitHubリポジトリをデプロイ元とし、配信物はHTML、CSS、JavaScript、JSONなどの静的ファイルに限定する。Workers、Functions、サーバ、データベース、外部APIは使用しない。ユーザーが入力したプロジェクトデータはブラウザ内にのみ保存し、Cloudflareへ送信しない。

### How should releases be deployed? (`delivery.deployment_workflow`)

- Project owner speaking as developer: git_push_automatic
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: GitHubリポジトリの本番ブランチへのpushを契機に、Cloudflare Pagesが自動的にビルドおよびデプロイする。push前にローカルでテスト、スキーマ互換性、日本語表示、Import・Exportを確認する。公開内容はGitコミットおよびリリースタグで追跡可能にし、問題発生時はコミットのrevertまたはCloudflare Pagesの以前のデプロイへ戻せるようにする。

### Who will maintain the project after release? (`delivery.maintenance_owner`)

- Project owner speaking as developer: client_or_owner
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: リリース後の保守責任はProject ownerが担う。現在はProject ownerとOriginal developerが同一であり、GitHubリポジトリ、Cloudflare Pages、ドメイン、リリース判断を管理する。保守範囲には、不具合対応、依存関係とセキュリティの確認、ブラウザ互換性、日本語表示、英語版とのスキーマ互換性、Import・Exportの検証を含む。外部からの提案やContributionを受け付ける場合も、統合および公開の最終判断はProject ownerが行う

### What handoff level is required? (`delivery.handoff_level`)

- Project owner speaking as developer: docs_and_tests
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 引き継ぎ可能な成果物として、完全なソースコード、README、セットアップ・ビルド・デプロイ手順、自動テストをGitHubリポジトリに含める。文書には、データスキーマ、安定したキーと選択値、英語版との互換性、日本語化ルール、ブラウザ内保存、Import・Export、Cloudflare Pagesへの公開手順を記載する。アカウント、ドメイン、Cloudflareの権限移管は、実際に所有者が変更される場合に別途実施する。

### Who has authority to accept the release? (`acceptance.approver`)

- Project owner speaking as developer: decision_owner
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: リリースを受け入れる最終権限は、Project ownerであるDecision ownerが持つ。DeveloperまたはTechnical reviewerはテスト結果と検証証拠を提示するが、それ自体を受入決定とはしない。日本語表示、英語版とのスキーマ互換性、Import・Export、ブラウザ内保存、アクセシビリティ、主要フロー、Cloudflare Pages上の公開結果を確認した後、Decision ownerが受入を記録する。現在は各役割を同一人物が担うが、役割上の区別は維持する。

### What evidence should be used for acceptance? (`acceptance.review_method`)

- Project owner speaking as developer: combined
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 受入証拠は、要件チェックリスト、自動テスト結果、主要シナリオの手動確認、視覚レビュー、アクセシビリティ確認、性能確認の組み合わせとする。自動テストは全件成功を必須とし、プロジェクト作成、回答、Resolution、Review、Overrides、JSONのImport・Exportを確認する。英語版データの日本語版へのImportと、安定したキー・選択値・スキーマの維持を検証する。日本語表示はデスクトップとモバイルで確認し、キーボード操作、フォーカス、ラベル、コントラスト、およびLighthouse等による性能測定も実施する。データ消失、互換性破壊、主要フローの操作不能がある場合は受け入れない。

### Which scenarios must pass before release? (`acceptance.must_pass_scenarios`)

- Project owner speaking as developer: primary_content, primary_action, local_persistence, keyboard, mobile, import_export, failure_recovery, other
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 主要コンテンツの理解、質問への回答とResolutionの確定、ブラウザ内保存と再読み込み、全操作のキーボード利用、モバイルでの基本操作、JSONのImport・Exportによるデータ保持、エラー時の復旧が成功することを必須とする。加えて、英語版データを日本語版へImportしても安定したキー・選択値・スキーマ・ContributionとResolutionの区別が維持され、再Export後も情報が欠落しないことを確認する。認証および決済フローは製品範囲外とする。

### How should unresolved premises affect the work? (`acceptance.unresolved_policy`)

- Project owner speaking as developer: document_and_continue
  Recorded by Project owner via direct_input; authority: decision_owner; confirmation: directly_reported.
  Context: 未解決の前提はUnknownとして明示し、AIや実装者が暗黙に補完しない。影響を受けない作業は継続できるが、その前提に依存する設計・実装・受入判断は保留する。特にデータ互換性、プライバシー、アクセシビリティ、破壊的操作、公開可否に影響する場合は、Decision ownerによるResolutionを得るまで確定しない。暫定判断で進める場合は、根拠・影響範囲・決定者をProvisionalとして明示する。


## Open conflicts

None recorded.

## Acceptance criteria

- What observable result would make this release worthwhile? (`project.success_evidence`): 日本語利用者が、プロジェクト作成から前提の入力・確認・確定・エクスポートまでを、一連のワークフローとして完了できることを優先する。
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Primary content is understandable
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Primary user action completes
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Local save and reload work
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Required keyboard flow works
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Required mobile flow works
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Import and export preserve data
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Failure and recovery behavior works
- Which scenarios must pass before release? (`acceptance.must_pass_scenarios`): Another must-pass scenario

## Applied Override history

None recorded.
