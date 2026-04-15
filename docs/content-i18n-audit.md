# Baisheng Web Content I18n Audit

## Goal

This audit separates:

- UI copy that should continue to live in `next-intl`
- database values that should stay as raw business/user content
- database values that should be normalized into stable codes and translated in the UI
- cases where bilingual content columns are only worth adding for curated system-authored content

## Current conclusion

The English UI is already mostly clean. The remaining Chinese text visible in English mode comes from database content such as user names or organization names, not from untranslated interface copy.

## Current live DB snapshot

Read-only sampling on 2026-04-15 shows:

- `business_category.category` currently stores `purchase` and `service`
- `purchase_order_type.business_subcategory` currently stores `sourcing`, `dropshipping`, `tourist_shopping`, `group_buying`
- `service_order_type.business_subcategory` currently stores `tour_escort`, `medical_escort`, `digital_survival`, `airport_transfer`, `car_service`, `vip_recharge`
- these values are already code-like and should stay that way
- `team_profiles`, `task_main`, and `commission_record` are currently empty, so there is no existing live authored content in those tables that needs bilingual cleanup right now

## Rule set

### 1. Do not translate raw user or business entity data

These values should remain exactly as entered or legally registered:

- person names
- company names
- team names when they are internal proper nouns rather than standardized labels
- user-written notes, descriptions, and free text
- uploaded file names
- document numbers, passport numbers, ID card numbers, phone numbers, referral codes

Reason:

- they are source-of-truth business data
- translating them can create ambiguity, legal mismatch, or broken search behavior

### 2. Keep enums and system states as stable codes, then translate in the UI

These should stay as machine-oriented values in the database, with display labels handled by `next-intl`:

- roles like `administrator`, `salesman`, `client`
- statuses like `active`, `pending`, `completed`
- task scopes like `public`, `team`
- commission statuses and categories
- order statuses, order categories, purchase/service subtype codes
- currency codes such as `USD`, `CNY`

Reason:

- stable codes are locale-agnostic
- one code can map to multiple display languages safely
- filtering, reporting, and API contracts stay predictable

### 3. Only add content-layer bilingual fields for curated system-authored business copy

Examples:

- centrally managed service names shown to all users
- reusable task templates maintained by the business
- official team descriptions, notices, onboarding text, announcement templates

Recommended shape:

- `title_zh`, `title_en`
- `description_zh`, `description_en`

Only do this when the same record is meant to be displayed to different language audiences as authored content, not raw submitted data.

## Module audit

| Module | Fields currently coming from DB | Recommendation |
| --- | --- | --- |
| My profile | `user_profiles.name`, `user_profiles.city`, `user_privacy_requests.passport_requests`, `user_privacy_requests.id_card_requests`, `user_media_assets.original_name` | Keep raw. These are personal/profile values or uploaded asset names. Do not translate. |
| Referral tree | `referrer_name`, `new_user_name` and any organization/user labels returned by `get_referral_tree_edges` | Keep raw. These are identities and proper nouns. |
| Team | `team_profiles.team_name`, `manager_name`, member names, client names, `current_team_name` | Keep raw by default. Only add bilingual columns if team names/descriptions are centrally curated labels rather than internal proper nouns. |
| Tasks | `task_main.task_name`, `task_main.task_intro`, `team_profiles.team_name`, `task_sub.original_name` | Default to raw. If tasks become reusable official templates, then add bilingual columns for task title/intro; do not translate attachment names. |
| Orders | `order_overview.order_number`, supplementary `order_details`, `business_category.category`, `purchase_order_type.business_subcategory`, `service_order_type.business_subcategory` | `order_number` and freeform detail values stay raw. Category/subtype tables should hold stable codes, not localized display text. |
| Commission | `commission_record.settlement_note`, `calculation_snapshot` | Notes stay raw. Snapshot data should remain structured and language-agnostic. |
| Reviews | review target user `name`, `email`, `passport_requests`, `id_card_requests`, media `original_name` | Keep raw. These are submitted review artifacts, not UI copy. |
| Exchange rates | `original_currency`, `target_currency` | Keep as ISO-like codes. Do not localize in the DB. Display formatting belongs in UI. |

## Recommended cleanup backlog

### Priority A: keep as-is, no content translation

- `user_profiles.name`
- `user_profiles.city`
- `user_privacy_requests.passport_requests`
- `user_privacy_requests.id_card_requests`
- `user_media_assets.original_name`
- `referrer_name`
- `new_user_name`
- `team_profiles.team_name` if it is just an internal/proper-noun team name
- `task_main.task_name` and `task_main.task_intro` when they are ad hoc human-written tasks
- `commission_record.settlement_note`
- uploaded attachment names

### Priority B: normalize to codes if the DB still stores display text

- `business_category.category`
- `purchase_order_type.business_subcategory`
- `service_order_type.business_subcategory`

Expected direction:

- store values like `purchase`, `service`, `sourcing`, `tour_escort`
- keep all labels in UI dictionaries

### Priority C: add bilingual content columns only if the business needs authored multilingual records

- official task templates
- official team descriptions
- official notices or reusable announcements
- curated service catalog text

## Suggested implementation policy

1. User-generated and identity data:
   Keep one canonical value only.

2. Enum/state/type data:
   Store stable codes only and translate in the app.

3. Curated business-authored content:
   Add explicit bilingual columns and select by locale in the app.

4. Freeform structured payloads such as order detail JSON:
   Split schema labels from submitted values. Translate labels in UI, but keep submitted values raw.

## Evidence from the current codebase

- User identity/profile and review-related raw fields are loaded directly from tables like `user_profiles`, `user_privacy_requests`, `user_media_assets`, and pending review views.
- Referral and team modules read raw names and team names from RPC/table results.
- Tasks use raw `task_name`, `task_intro`, `team_name`, and attachment `original_name`.
- Order, commission, task, exchange-rate, and account status displays already rely heavily on code values that are mapped to localized UI labels.

## Final recommendation

For this project, do **not** attempt blanket database translation.

The correct model is:

- UI copy: `next-intl`
- enums/codes: store codes, translate in UI
- user/business identity data: keep raw
- curated reusable business content: add explicit `zh/en` content fields only when there is a real multilingual publishing need
