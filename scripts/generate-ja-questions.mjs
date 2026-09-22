import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "templates/web-small-app/questions/en.json");
const targetPath = resolve(root, "templates/web-small-app/questions/ja.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));

const categoryTranslations = {
  "project.intent": ["プロジェクトの目的", "何を作るのか、なぜ重要なのか、現在どの段階にあるのかを定義します。", "依頼者または決定権者を優先してください。開発者による解釈は、別のContributionとして記録します。"],
  "audience.context": ["対象者と利用状況", "成果物を使う人と、その利用条件を説明します。", "可能な場合は、実際のエンドユーザーから得た情報と、プロジェクトチームの仮定を分けて記録します。"],
  "scope.deliverables": ["スコープと成果物", "リリース範囲、必要な画面・機能、除外事項を明示します。", "依頼者は希望する範囲を説明できます。開発者は実現可能性と実装上の影響を別に記録できます。"],
  "content.data": ["コンテンツとデータ", "コンテンツの責任者と、ユーザー入力データの取り扱いを明確にします。", "編集上の事実はコンテンツ責任者から、データ取り扱いは権限のある技術・プライバシー担当者から確認します。"],
  "design.interaction": ["デザインと操作", "視覚的な方向性と操作上の希望を、必須制約と混同せずに記録します。", "エンドユーザーの観察、依頼者の希望、デザイナーの提案を別々のContributionとして保持します。"],
  "technology.runtime": ["技術と実行環境", "技術スタックの自由度、実行時の境界、ブラウザ対応、外部サービスを定義します。", "開発者は実装案を提示できます。その案が助言なのか、権限を伴う技術判断なのかを記録します。"],
  "quality.accessibility": ["品質とアクセシビリティ", "アクセシビリティ、レスポンシブ対応、性能の期待水準を定めます。", "観察された利用者ニーズと技術・コンプライアンス上の権限を組み合わせ、一方で他方を置き換えないようにします。"],
  "risk.boundaries": ["リスクと境界", "起きてはならないことと、高コストになる障害を明示します。", "禁止事項は、決定権者または該当分野の権限者に確認します。"],
  "delivery.operations": ["デリバリーと運用", "ホスティング、デプロイ、保守、引き継ぎの期待を定義します。", "保守担当者の運用要件と、開発者が望む作業手順を分けて記録します。"],
  "acceptance.validation": ["受入と検証", "誰が成果物を受け入れ、何を完了の証拠とするかを定義します。", "最終Resolutionは、リリースを受け入れる権限を持つ人またはグループが決定します。"]
};

const resolutionTranslations = {
  confirmed: ["確定", "承認済みのプロジェクト前提として使用します。"],
  provisional: ["暫定", "現時点では使用しますが、変更可能であることを明示します。"],
  unspecified: ["未決定", "未決定のままにします。AIに暗黙の補完をさせません。"],
  proposal_requested: ["提案を求める", "選択済みとは扱わず、代替案または推奨案を求めます。"],
  delegated: ["範囲を定めて委任", "定めた範囲内で実装者またはAIに判断を任せ、選択結果の報告を求めます。"],
  not_applicable: ["該当なし", "この質問をプロジェクトの対象外として扱います。"]
};

const translations = {
  "project.intent.project_kind": { p: "何を作りますか？", h: "このリリースに最も近い形を選択してください。", c: { informational_site: "情報提供サイト", landing_page: "ランディングページ", portfolio: "ポートフォリオ", public_content_site: "公開コンテンツサイト", browser_local_utility: "ブラウザ内で動作するユーティリティ", small_web_app: "小規模Webアプリケーション", mixed: "複数の形を含むリリース" } },
  "project.intent.primary_outcome": { p: "このリリースで実現すべき主な成果は何ですか？", h: "トレードオフが必要なときに優先する成果を選択してください。", c: { explain_information: "情報を理解できるようにする", generate_leads: "問い合わせや見込み客を獲得する", showcase_work: "実績や能力を紹介する", complete_workflow: "利用者が一連の作業を完了できるようにする", provide_utility: "目的を絞ったツールを提供する", publish_content: "コンテンツを公開・整理する", validate_idea: "アイデアや試作品を検証する", other: "その他の成果" } },
  "project.intent.current_phase": { p: "プロジェクトは現在どの段階ですか？", h: "既存の動作を新規作成、維持、拡張、修復のどれとして扱うかが変わります。", c: { new_build: "新規開発", redesign: "再設計", extension: "拡張", repair: "修復" } },
  "project.intent.success_evidence": { p: "どのような観測可能な結果があれば、このリリースに価値があったと言えますか？", h: "一般的な願望ではなく、確認できる証拠を記述してください。短い回答で構いません。", ph: "例：初めて訪れた人が、助けを借りずに内容を理解して問い合わせを送信できる。" },
  "audience.context.primary_group": { p: "主な対象者は誰ですか？", h: "最初のリリースでニーズを優先するグループを選択してください。", c: { general_public: "一般の利用者", prospective_customers: "見込み顧客", existing_customers: "既存顧客", internal_staff: "社内スタッフ", professionals: "専門職・実務担当者", creators: "制作者・寄稿者", students_researchers: "学生・研究者", defined_community: "特定のコミュニティ", mixed: "複数のグループを同等に重視", other: "その他の対象者" } },
  "audience.context.relationship": { p: "多くの利用者は、このプロジェクトとどのような関係にありますか？", h: "初期案内、説明量、ナビゲーションの深さを決める手掛かりになります。", c: { first_time_visitors: "主に初回訪問者", occasional_visitors: "時々訪れる利用者", returning_users: "継続的に利用する人", authenticated_members: "認証済みメンバー", known_internal_users: "既知の社内利用者", mixed: "複数の関係が混在" } },
  "audience.context.domain_familiarity": { p: "主な対象者は、この分野にどの程度詳しいですか？", h: "可能な限り、観察または本人から得た知識レベルを基に回答してください。", c: { none: "事前知識を前提としない", basic: "基本的な知識がある", working: "実務で使える知識がある", expert: "専門知識がある", mixed: "知識レベルが大きく異なる" } },
  "audience.context.primary_context": { p: "プロジェクトはどのような状況で利用されますか？", h: "デザインや実装に実質的な影響がある条件をすべて選択してください。", c: { mobile_on_move: "移動中のモバイル利用", mobile_stationary: "静止した状態でのモバイル利用", desktop_office: "職場でのデスクトップ利用", desktop_home: "自宅でのデスクトップ利用", tablet_or_kiosk: "タブレットまたはキオスク", constrained_network: "低速または不安定なネットワーク", assistive_technology: "支援技術の利用", mixed: "混在または予測困難な状況" } },
  "scope.deliverables.required_surfaces": { p: "このリリースに必要な画面・機能領域はどれですか？", h: "将来追加できるものではなく、このリリースに必須のものだけを選択してください。", c: { home_or_entry: "ホームまたは入口画面", content_pages: "コンテンツページ", listing_or_index: "一覧または索引", detail_views: "詳細画面", form: "フォーム", dashboard: "ダッシュボードまたはワークスペース", settings: "設定", authentication: "サインインまたはアカウントフロー", admin: "管理画面", legal: "法務・方針ページ", error_empty_states: "エラー状態と空状態", other: "その他の必須領域" } },
  "scope.deliverables.primary_user_action": { p: "利用者が完了できるべき最も重要な操作は何ですか？", h: "主要フローを定義する操作を選択してください。", c: { read_or_understand: "読む・理解する", navigate_or_discover: "コンテンツを探す・移動する", submit_form: "フォームを送信する", search_or_filter: "検索・絞り込みを行う", create_or_edit: "何かを作成・編集する", calculate_or_transform: "データを計算・変換する", upload_or_download: "アップロード・ダウンロードする", manage_account: "サインイン・アカウント管理を行う", purchase_or_pay: "購入・支払いを行う", other: "その他の主要操作" } },
  "scope.deliverables.release_boundary": { p: "最初のリリース範囲をどのように区切りますか？", h: "現時点で最も明確な境界を選択してください。曖昧な境界は未決定として見える状態にします。", c: { single_page: "1ページ", small_fixed_set: "少数の固定ページ", bounded_app_flow: "明確に区切られた1つのアプリフロー", existing_scope_redesign: "現在の製品範囲を再設計", specific_repair: "特定の修復のみ", phased_mvp: "定義済みのMVP段階", not_yet_bounded: "範囲はまだ明確でない" } },
  "scope.deliverables.explicit_exclusions": { p: "このリリースで明示的に対象外とするものは何ですか？", h: "新しい決定なしに作業へ入れてはならない、追加候補や暗黙の前提を列挙してください。", ph: "例：最初のリリースでは、アカウント、サーバーデータベース、決済、CMSを含めない。" },
  "content.data.source_owner": { p: "プロジェクトのコンテンツは誰が担当しますか？", h: "文章、メディア、元情報を提供または承認する主体を選択してください。", c: { owner_supplies_final: "プロジェクト所有者が完成コンテンツを提供", owner_supplies_draft: "プロジェクト所有者が草案を提供", developer_structures: "開発者が提供資料を構成", developer_writes_from_brief: "開発者が承認済みの概要から作成", shared_responsibility: "共同で担当", migrate_existing: "既存コンテンツを移行", not_yet_assigned: "未割り当て" } },
  "content.data.readiness": { p: "コンテンツはどの程度準備できていますか？", h: "公開時の見込みではなく、現在利用できる資料を評価してください。", c: { final: "完成・承認済み", mostly_ready: "ほぼ準備済み", partial: "一部のみ利用可能", source_material_only: "元資料のみ存在", not_started: "未着手" } },
  "content.data.user_input_types": { p: "どのようなユーザーデータがシステムに入りますか？", h: "テレメトリを含め、リリースが意図して受け取るデータ種別をすべて選択してください。", c: { none: "ユーザーデータなし", contact_details: "連絡先情報", account_profile: "アカウント・プロフィール情報", free_text: "自由記述", files: "アップロードファイル", payment_related: "決済関連データ", analytics_telemetry: "分析・テレメトリ", location_device: "位置・端末データ", other: "その他のデータ種別" } },
  "content.data.storage": { p: "プロジェクトデータまたはユーザー入力データをどこに保存できますか？", h: "現時点で最も厳しい境界を選択してください。Premise Builder自体ではなく、定義対象の製品について答えます。", c: { no_user_data: "ユーザーデータを保存しない", session_only: "現在のセッション中のみ", browser_local_only: "利用者のブラウザ内のみ", server_storage_allowed: "プロジェクト管理下のサーバー保存を許可", third_party_storage: "承認済み第三者による保存を許可", hybrid: "ローカル、サーバー、第三者保存を定義済みの形で併用" } },
  "content.data.retention": { p: "保持するユーザーデータをいつまで残せますか？", h: "永続する可能性のあるデータをプロジェクトが受け取る場合に表示されます。", c: { no_retention: "保持しない", until_session_ends: "セッション終了まで", until_local_deletion: "利用者がローカルデータを削除するまで", fixed_period: "定めた期間", account_lifetime: "アカウントの存続期間", governed_by_policy: "承認済み方針に従う" } },
  "design.interaction.tone": { p: "デザインを導く視覚的な特性はどれですか？", h: "最大3つ選択してください。別の制約で必須とされない限り、これらは希望として扱います。", c: { minimal: "最小限", editorial: "編集的", technical: "技術的", playful: "遊び心がある", premium: "上質", warm: "温かみがある", institutional: "組織的", bold: "力強い", quiet: "落ち着いた", brand_led: "既存ブランドを基準にする" } },
  "design.interaction.brand_source": { p: "プロジェクトはどの視覚システムに従いますか？", h: "現在利用できる最も権威のある情報源を選択してください。", c: { fixed_design_system: "固定のデザインシステム", existing_brand_guidelines: "既存のブランドガイドライン", partial_assets: "一部のブランド素材", visual_reference_only: "参考例のみ", no_existing_brand: "既存の視覚システムなし", preserve_current_ui: "現在のインターフェースを維持" } },
  "design.interaction.information_density": { p: "一度にどの程度の情報を表示しますか？", h: "好みだけでなく、主要タスクと対象者に基づいて選択してください。", c: { sparse_guided: "情報を絞って案内を重視", balanced: "バランス型", dense_operational: "高密度で運用重視", progressive_disclosure: "詳細を段階的に表示", varies_by_view: "画面ごとに変える" } },
  "design.interaction.motion": { p: "動きをどのように使用しますか？", h: "動きによって状態を分かりにくくしたり、動きの抑制設定を妨げたりしてはいけません。", c: { none: "不要な動きは使用しない", subtle_feedback: "控えめな状態フィードバックのみ", moderate_transitions: "適度なトランジション", expressive: "有効な場面で表現的な動きを使用", reduced_motion_first: "動きの抑制を優先" } },
  "technology.runtime.stack_policy": { p: "実装スタックはどの程度固定されていますか？", h: "固定スタックは制約です。推奨スタックには、妥当な理由があれば代替案を認めます。", c: { fixed: "固定スタック", preferred_negotiable: "希望はあるが変更可能", open_to_recommendation: "提案を受け付ける", preserve_existing: "既存スタックを維持", static_files_only: "単純な静的ファイルのみ" } },
  "technology.runtime.mode": { p: "製品はどの実行モデルを使用できますか？", h: "デプロイ後の製品が実行時に依存できるものを選択してください。", c: { fully_static: "完全な静的サイト", browser_local: "静的サイト＋ブラウザ内状態", static_external_apis: "静的フロントエンド＋承認済み外部API", server_backed: "サーバーを使用するアプリケーション", hybrid: "複合型の実行モデル" } },
  "technology.runtime.browser_support": { p: "どのブラウザ対応範囲を適用しますか？", h: "すべてのブラウザを約束するのではなく、検証可能な方針を選択してください。", c: { evergreen_current: "現在の主要な自動更新ブラウザ", recent_two_versions: "現在および過去2メジャーバージョン", mobile_priority: "最新モバイルブラウザを優先", enterprise_legacy: "企業向け・旧式ブラウザが必要", specified_matrix: "提示されたブラウザ一覧を使用", no_special_constraint: "合理的な最新ブラウザ対応以外の特別な制約なし" } },
  "technology.runtime.external_services": { p: "どの外部サービスが必要ですか？", h: "リリースに必要なサービスを選択してください。承認、認証情報、データ境界は別途決定します。", c: { none: "外部サービスなし", cms: "コンテンツ管理システム", analytics: "アクセス解析", authentication: "認証プロバイダー", payments: "決済プロバイダー", email_forms: "メール・フォーム送信", maps: "地図・位置情報サービス", ai_api: "AIサービス・API", other: "その他のサービス" } },
  "technology.runtime.discoverability": { p: "プロジェクトをどのように発見できる状態にしますか？", h: "検索インデックスと機械可読な公開情報を要件とするかを決めます。", c: { public_search_critical: "公開検索での発見が必須", public_search_helpful: "公開検索で見つかるとよい", direct_link_only: "直接リンクで十分", private_noindex: "非公開またはnoindex", app_shell: "公開アプリシェルのみ索引対象" } },
  "quality.accessibility.target": { p: "どのアクセシビリティ目標を適用しますか？", h: "レビュー時に根拠を示せる水準を選択してください。", c: { semantic_baseline: "意味構造と操作性の基礎水準", wcag_aa: "WCAG AAを目標", legal_contractual: "法令または契約上の基準", best_effort: "明示した範囲内で最善を尽くす", specific_requirements: "提示されたアクセシビリティ要件を使用" } },
  "quality.accessibility.keyboard": { p: "どの程度のキーボード操作が必要ですか？", h: "キーボード対応には、フォーカスの視認性、論理的な順序、操作可能なコントロールが含まれます。", c: { all_controls: "すべてのコントロールとフロー", primary_flow: "少なくとも主要フロー", content_navigation: "コンテンツの移動のみ", fixed_pointer_environment: "固定されたポインター専用環境" } },
  "quality.accessibility.responsive": { p: "どのレスポンシブ優先度を適用しますか？", h: "対応しない表示幅を明示しつつ、意図するバランスを選択してください。", c: { mobile_desktop_equal: "モバイルとデスクトップを同等に重視", mobile_priority: "モバイルを優先", desktop_priority: "デスクトップを優先", fixed_environment: "固定の表示環境", preserve_current_behavior: "現在のレスポンシブ動作を維持" } },
  "quality.accessibility.performance": { p: "どの性能基準をトレードオフ判断に使用しますか？", h: "プロジェクトが検証できる範囲で、最も有用で厳しい基準を選択してください。", c: { core_web_vitals: "合意したCore Web Vitals目標を満たす", constrained_network: "制約のあるネットワークでも利用可能", balanced: "速度と機能の深さを両立", feature_priority: "必要な機能を速度より優先する場合がある", explicit_budget: "提示されたパフォーマンス予算を使用" } },
  "risk.boundaries.prohibited_practices": { p: "禁止する慣行はどれですか？", h: "必須の境界だけを選択してください。希望は該当カテゴリに記録します。", c: { none_known: "既知の禁止事項なし", inline_css: "インラインCSS", external_fonts: "外部読み込みフォント", behavioral_tracking: "行動追跡", nonessential_cookies: "必須でないCookie", unapproved_cdn: "未承認の外部CDN", client_side_secrets: "クライアント側コード内の秘密情報", autoplay_media: "メディアの自動再生", unconfirmed_destructive_actions: "確認なしの破壊的操作", vendor_lock_in: "ベンダーロックイン", other: "その他の禁止事項" } },
  "risk.boundaries.privacy_level": { p: "対象範囲で最も高いプライバシー機密度はどれですか？", h: "平均的なデータではなく、意図するデータフローのうち最も機密性の高いものを基に選択してください。", c: { none: "個人データなし", low_nonsensitive: "低リスクで機密性の低い個人データ", personal_data: "個人データ", sensitive_data: "機微な個人データ", regulated_data: "規制対象または特別に保護されるデータ", unknown: "機密度がまだ不明" } },
  "risk.boundaries.high_cost_failure": { p: "どの障害が最も大きな損失につながりますか？", h: "設計、レビュー、実装の優先度を変えるべき障害を選択してください。", c: { no_unusual_cost: "特別に高コストな障害なし", data_loss: "データ消失", privacy_breach: "プライバシー・セキュリティ侵害", inaccessible_primary_flow: "主要フローをアクセシブルに利用できない", wrong_information: "誤った、または誤解を招く情報", downtime: "停止・利用不能", performance_failure: "性能低下", brand_damage: "ブランド・信頼の毀損", scope_overrun: "スコープ・コスト超過", other: "その他の高コスト障害" } },
  "risk.boundaries.compliance": { p: "どのコンプライアンス情報源が適用されますか？", h: "既知の情報源を選択してください。該当する場合は、正確な規格・方針をメモに記録します。", c: { none_known: "既知のコンプライアンス要件なし", privacy_law: "プライバシー法令・規制", cookie_consent: "Cookie・同意要件", accessibility_law: "アクセシビリティ法令・規格", copyright_licensing: "著作権・ライセンス規則", industry_specific: "業界固有の規則", organization_policy: "組織の方針", other: "その他のコンプライアンス情報源" } },
  "delivery.operations.hosting": { p: "リリースはどこでホストする予定ですか？", h: "デプロイ詳細が暫定的でも、現在の対象を選択してください。", c: { github_pages: "GitHub Pages", cloudflare_pages: "Cloudflare Pages", other_static_host: "その他の静的ホスト", cloud_application_platform: "クラウドアプリケーション基盤", existing_environment: "既存の管理環境", local_only: "ローカル利用のみ" } },
  "delivery.operations.deployment_workflow": { p: "リリースをどのようにデプロイしますか？", h: "保守担当者が実際に運用できる手順を選択してください。", c: { manual_upload: "手動アップロード", git_push_automatic: "Git pushから自動デプロイ", pull_request_gate: "デプロイ前にPull Requestレビュー", platform_cli: "プラットフォームのCLIでデプロイ", existing_ci: "既存のCI/CDワークフロー" } },
  "delivery.operations.maintenance_owner": { p: "リリース後は誰がプロジェクトを保守しますか？", h: "成果物を理解して運用できる必要がある役割を記録してください。", c: { original_developer: "元の開発者", internal_team: "社内チーム", client_or_owner: "依頼者またはプロジェクト所有者", shared: "共同保守", no_regular_maintenance: "定期保守の予定なし", not_yet_assigned: "未割り当て" } },
  "delivery.operations.handoff": { p: "どの引き継ぎレベルが必要ですか？", h: "次の保守担当者が安全に作業できる最小の構成を選択してください。", c: { source_only: "ソースファイルのみ", source_readme: "ソースファイルとREADME", docs_and_tests: "ソース、文書、テスト", operational_runbook: "文書と運用手順書", full_transfer: "所有権とアクセス権の完全移管", ongoing_support: "継続的なサポート契約" } },
  "acceptance.validation.approver": { p: "リリースを受け入れる権限を持つのは誰ですか？", h: "レビュー作業を行う人ではなく、承認する役割を選択してください。", c: { decision_owner: "決定権者", requester: "依頼者・クライアント", end_user_representative: "エンドユーザー代表", technical_reviewer: "技術レビュー担当", compliance_reviewer: "コンプライアンスレビュー担当", multiple_approvers: "複数の承認者", not_yet_assigned: "未割り当て" } },
  "acceptance.validation.review_method": { p: "受入にはどの証拠を使用しますか？", h: "主要なレビュー方法を選択してください。補足証拠はコンテキストに追加できます。", c: { visual_review: "視覚レビュー", requirements_checklist: "要件チェックリスト", scenario_demonstration: "シナリオ実演", automated_tests: "自動テスト結果", accessibility_audit: "アクセシビリティ監査", performance_audit: "性能監査", combined: "定義済みの組み合わせ" } },
  "acceptance.validation.must_pass_scenarios": { p: "リリース前に成功必須のシナリオはどれですか？", h: "失敗した場合に受入を止めるシナリオを選択してください。", c: { primary_content: "主要コンテンツを理解できる", primary_action: "主要な利用者操作を完了できる", form_submission: "フォーム送信が成功する", local_persistence: "ローカル保存と再読み込みが動作する", authentication: "認証フローが動作する", payment: "決済フローが動作する", keyboard: "必要なキーボード操作が動作する", mobile: "必要なモバイル操作が動作する", import_export: "Import・Exportでデータが保持される", failure_recovery: "障害発生時と復旧の動作が機能する", other: "その他の成功必須シナリオ" } },
  "acceptance.validation.unresolved_policy": { p: "未解決の前提を作業にどう反映しますか？", h: "既定の方針を選択してください。個別のUnknownには別の明示的状態を設定できます。", c: { block_dependent_work: "依存する作業を止める", provisional_with_label: "暫定であることを明示して進める", proposal_before_work: "依存作業の前に提案を求める", delegate_with_bounds: "範囲を明示して委任する", document_and_continue: "未決定事項を記録し、独立した作業を続ける", case_by_case: "個別に判断する" } }
};

const localized = structuredClone(source);
localized.locale = "ja";
localized.direction = "ltr";
localized.template = {
  name: "Webサイト・小規模Webアプリ",
  summary: "Webサイトまたは明確に範囲を限定したWebアプリケーションの作業前提を定義します。"
};
localized.categories = source.categories.map((category) => {
  const translated = categoryTranslations[category.id];
  if (!translated) throw new Error(`Missing category translation: ${category.id}`);
  return { ...category, label: translated[0], description: translated[1], perspectiveHint: translated[2] };
});
localized.resolutionStates = source.resolutionStates.map((state) => {
  const translated = resolutionTranslations[state.value];
  if (!translated) throw new Error(`Missing resolution translation: ${state.value}`);
  return { ...state, label: translated[0], description: translated[1] };
});
localized.answerContext = {
  answeringFrom: "回答元",
  recordedBy: "記録者",
  speakingAs: "回答時の役割",
  captureMethod: "取得方法",
  authority: "この回答の権限",
  confirmation: "情報源の確認状態",
  changeForQuestion: "この質問で変更",
  multiplePerspectives: "別の観点を追加"
};
localized.messages = {
  "validation.provenanceRequired": "この回答が表す観点と記録者を選択してください。",
  "validation.speakingRoleMismatch": "選択した回答時の役割は、その参加者に割り当てられていません。",
  "validation.inferenceUnconfirmed": "推測による回答は、権限のある人が確認するまで未確認のままにしてください。",
  "validation.resolutionAuthorityRequired": "この前提の確定には、権限のある決定元が必要です。",
  "validation.exclusiveChoice": "この選択肢は他の選択肢と組み合わせられません。",
  "validation.noteRequired": "この選択について短い補足を入力してください。",
  "validation.selectionLimit": "選択数を上限以内に減らしてください。",
  "review.authRuntime": "認証が対象に含まれていますが、選択した実行モデルでは外部サービスまたはサーバーが必要になる可能性があります。",
  "review.paymentHandling": "決済関連データが対象に含まれています。処理主体と、プロジェクトが保存できる範囲を確認してください。",
  "review.analyticsPrivacy": "分析またはテレメトリが対象に含まれています。プライバシー境界、同意、禁止事項を再確認してください。"
};
localized.questions = source.questions.map((question) => {
  const translated = translations[question.questionId];
  if (!translated) throw new Error(`Missing question translation: ${question.questionId}`);
  const result = { ...question, prompt: translated.p, help: translated.h };
  if (question.placeholder) result.placeholder = translated.ph;
  if (question.choices) {
    result.choices = question.choices.map((choice) => {
      const label = translated.c?.[choice.value];
      if (!label) throw new Error(`Missing choice translation: ${question.questionId}/${choice.value}`);
      return { ...choice, label };
    });
  }
  return result;
});

await writeFile(targetPath, `${JSON.stringify(localized, null, 2)}\n`);
console.log(`Wrote ${targetPath}`);
