# 🎯 SouqOne Mobile App — Full Product & Technical Audit
## Prompt for Claude Code (Multi-Phase Execution)

---

## 📌 HOW TO USE THIS FILE

Send **Phase 0** first to set up context. Then send each phase **one at a time**, in order, in **separate messages/sessions**. Each phase produces its own report file. Don't skip phases — later phases reference earlier findings (e.g., the Release Checklist in Phase 8 pulls from every prior phase).

Suggested pacing: 1 phase per session/day if working solo, or run back-to-back if you have time blocked out.

---

## 🎭 PHASE 0 — ROLE SETUP & CONTEXT GATHERING

```
You are acting as FOUR senior roles simultaneously for this audit:

1. SENIOR PRODUCT MANAGER — evaluating feature completeness, business logic 
   correctness, and whether the product actually solves the user's job-to-be-done
2. SENIOR QA ENGINEER — hunting for bugs, edge cases, broken flows, and 
   regressions across all user paths
3. SENIOR UX AUDITOR — evaluating usability, visual consistency, interaction 
   design, accessibility, and whether the design system is applied consistently
4. SENIOR MOBILE ARCHITECT — evaluating code architecture, performance, 
   security, offline behavior, and technical debt

This is SouqOne (سوق وان) — a multi-vertical Arabic-language (RTL) marketplace 
app for Oman/GCC, covering: Cars, Buses, Heavy Equipment, Spare Parts, Jobs 
(driver marketplace), Services, and Transport (freight/shipping quotes). 
Built with Expo (React Native), NestJS backend, PostgreSQL/Prisma, Redis, 
Socket.io, Cloudinary, Thawani payments.

CRITICAL CONTEXT: This app has 7 distinct verticals that were built at 
different times by different sessions. A recurring risk is that each 
vertical implements the same concept (e.g., "contact seller", "filters", 
"empty states") in a slightly different way. Flag ANY inconsistency between 
verticals explicitly — this is as important as finding bugs within a single 
vertical.

Your job across this audit is NOT to just list problems. For every finding:
- State the SEVERITY (Blocker / Critical / High / Medium / Low)
- State the BUSINESS IMPACT in one sentence (why does this matter to revenue, 
  trust, or retention — not just "bad code")
- State which VERTICAL(S) it affects (Cars/Buses/Equipment/Parts/Jobs/Services/
  Transport/Global)
- Provide a CONCRETE fix — code, not vague advice

Before starting each phase below, do this:
1. Read the repo structure (`app/`, `src/`, especially api/, hooks/, store/, 
   components/) to build a mental map
2. Check for any existing audit docs already in the repo or referenced 
   (CHAT_AUDIT.md, MOBILE_APP_AUDIT.md, etc.) so you don't repeat work already 
   done — build on it instead
3. Confirm which backend repo (web monorepo) endpoints exist vs. what mobile 
   actually calls, so you can catch "mobile never wired to X" bugs

Output every phase as a markdown file named `AUDIT_PHASE_<N>_<name>.md` in 
the repo root (or wherever the user's output convention is). Use severity 
tags 🔴 Blocker/Critical, 🟠 High, 🟡 Medium, 🔵 Low throughout.

Confirm you understand this role setup, then wait for Phase 1.
```

---

## 🔍 PHASE 1 — PRODUCT REVIEW & FEATURE COMPLETENESS

```
PHASE 1: PRODUCT REVIEW

Audit each of the 7 verticals (Cars, Buses, Equipment, Parts, Jobs, Services, 
Transport) against this checklist. For each vertical, produce a table: 
Feature | Present? | Wired to backend? | Notes.

1.1 CORE LOOP COMPLETENESS
- Can a user browse → view detail → contact/act → complete transaction, 
  start to finish, for THIS vertical specifically?
- Where does the loop break? (e.g., "Services has no detail page" or 
  "Transport has no payment step after quote acceptance")
- Is there a clear CTA at every step, or does the user hit a dead end?

1.2 FEATURE PARITY ACROSS VERTICALS
- Build a matrix: rows = features (favorites, search, filters, sort, 
  contact seller, reviews, image gallery, sharing, reporting), 
  columns = verticals. Mark ✅/❌/⚠️ partial for each cell.
- Call out the worst offenders — which vertical is most behind the others?

1.3 BUSINESS LOGIC CORRECTNESS
- Pricing logic: are prices displayed with correct currency, decimals, 
  and do rental vs. sale vs. wanted listings show appropriate fields?
- Listing type logic: does WANTED behave differently from SALE/RENTAL 
  where it should (e.g., no price negotiation button, different card badge)?
- Quota/limits: are free-tier vs. premium listing limits enforced and 
  communicated to the user?
- Status transitions: what happens to a listing when marked sold/expired/
  archived — is this reflected immediately in all places it's cached 
  (list, favorites, chat context banner)?

1.4 MONETIZATION READINESS
- Are subscription/package tiers actually gating anything in the mobile 
  app, or just displayed?
- Is there a paywall or upsell moment anywhere, or is monetization purely 
  aspirational (UI exists, no enforcement)?
- Coupon/discount code entry — does it exist anywhere in the purchase flow?

1.5 MISSING ADMIN/TRUST FEATURES (mobile-relevant subset)
- Report listing / report user — exists anywhere?
- Block user — exists anywhere?
- Delete own account — required by App Store/Play Store guidelines — 
  does it exist? (This is a submission BLOCKER if missing.)

Output: `AUDIT_PHASE_1_PRODUCT.md` with the matrix, per-vertical breakdown, 
and a ranked list of the top 10 product gaps by business impact.
```

---

## 🎨 PHASE 2 — UX, VISUAL CONSISTENCY & DESIGN SYSTEM

```
PHASE 2: UX & DESIGN SYSTEM AUDIT

2.1 DESIGN SYSTEM AUDIT
- Pull every color, spacing, radius, and font-size value used directly 
  as a literal (e.g., `color: '#1234AB'`, `padding: 14`) instead of from 
  `constants/colors.ts`, `constants/spacing.ts`, `constants/radius.ts`, 
  `constants/typography.ts`. Report count per file, top 15 worst offenders.
- Are there multiple button styles doing the same job across different 
  screens (e.g., 3 different "primary CTA" button implementations)?
- Check font usage: is Almarai applied consistently, or do some screens 
  fall back to system font (check for missing font-family declarations)?

2.2 VISUAL CONSISTENCY ACROSS VERTICALS
- Compare the card component used in Cars vs Buses vs Equipment vs Parts 
  vs Services listing grids — are they the same UnifiedCard, or has each 
  vertical drifted into its own bespoke card?
- Compare empty states, loading skeletons, and error states across all 
  7 verticals — same component reused, or copy-pasted with drift?
- Compare filter/sort UI across verticals — same interaction pattern 
  (bottom sheet vs modal vs inline chips) or inconsistent?

2.3 NAVIGATION & INFORMATION ARCHITECTURE
- Map the full navigation graph: tabs → stacks → modals. Identify any 
  screen reachable only by deep link with no in-app entry point (orphan 
  screens) and any screen with no back/close affordance.
- Check tab bar behavior: does switching tabs preserve scroll position 
  and state, or does it reset (bad UX for browse-heavy tabs)?
- Check deep linking: do listing/chat/job push notification links open 
  the correct screen with correct params, or dump the user on the home tab?

2.4 INTERACTION DESIGN
- Long-press vs tap vs swipe — is the same gesture used for the same 
  intent everywhere (e.g., long-press always = contextual menu)?
- Haptic feedback — audit which actions have it vs. don't (send message, 
  favorite, delete, submit forms, pull-to-refresh)
- Loading states — do buttons show a spinner and disable during async 
  actions, or can users double-submit (double-post listing, double-send 
  message, double-payment)?

2.5 ACCESSIBILITY
- Touch target audit: flag every tappable element under 44x44pt
- Color contrast: flag text/background combos likely failing WCAG AA 
  (especially muted-gray-on-white patterns)
- accessibilityLabel coverage on images, icon-only buttons, and custom 
  controls (sliders, custom checkboxes)
- Dynamic type / font scaling: does the layout break if the user has 
  increased system font size?

2.6 RTL CORRECTNESS (dedicated pass beyond chat)
- Any component using `flexDirection: 'row'` where content visibly 
  mirrors incorrectly in Arabic (icons pointing the wrong way, 
  misaligned rows)?
- Any screen mixing LTR numbers/prices with RTL text incorrectly 
  (number should stay LTR even in RTL context — check this is handled)?
- Form inputs: is `textAlign` and `writingDirection` set consistently 
  for Arabic text fields across ALL forms (not just chat)?

Output: `AUDIT_PHASE_2_UX_DESIGN.md` with screenshots-as-code-references 
(file:line), a "design system violation" count, and a prioritized list 
of the 10 most visually jarring inconsistencies a real user would notice.
```

---

## 🔐 PHASE 3 — AUTH, ROLES, PERMISSIONS & SESSION MANAGEMENT

```
PHASE 3: AUTH, ROLES & SESSION AUDIT

3.1 AUTHENTICATION FLOWS
- Map every entry point: register, login, OTP/phone verification, social 
  login (if any), password reset. For each, trace: happy path, and what 
  happens on wrong OTP, expired OTP, network failure mid-flow, and 
  duplicate account attempt.
- Is there a guest/browse-without-login mode? If so, what exactly triggers 
  a forced login (posting, favoriting, messaging)? Is this consistent 
  across all 7 verticals or does one vertical forget to gate an action?

3.2 TOKEN & SESSION MANAGEMENT
- Where are auth tokens stored? (Should be SecureStore/Keychain, NOT 
  AsyncStorage — flag if AsyncStorage is used for tokens, this is a 
  security issue)
- Token refresh: is there a refresh token flow? What happens when the 
  access token expires mid-session — silent refresh, or does the user 
  get logged out unexpectedly?
- What happens on 401 responses globally — is there a single interceptor, 
  or does every API call handle it differently (or not at all)?
- Multi-device sessions: does logging in on a second device invalidate 
  the first, or are both valid? Is this intentional?

3.3 ROLES & PERMISSIONS
- What user roles exist (regular user, verified seller, carrier/driver 
  for Transport & Jobs, admin)? Is role stored client-side and trusted, 
  or always re-validated server-side for gated actions?
- Carrier registration (Transport) and Driver verification (Jobs) — 
  once submitted, what's the pending/approved/rejected state UX? Can a 
  user see their verification status anywhere?
- Cross-role UI leaks: does a regular user ever see carrier-only or 
  admin-only UI elements/buttons that then fail silently or error when 
  tapped?

3.4 SESSION EDGE CASES (QA focus)
- Force-quit app mid-login — does it recover cleanly on relaunch?
- Token expires while user is mid-way through posting a listing (multi-
  step form) — is draft data lost?
- Logout — does it clear ALL local state (React Query cache, Zustand 
  stores, AsyncStorage, socket connection) or leave stale data visible 
  to the next user on a shared device?
- Deep link into a chat/listing while logged out — correct redirect-
  then-return-to-target behavior, or lost context?

Output: `AUDIT_PHASE_3_AUTH_SESSION.md` with a state diagram (as markdown/
mermaid) of the auth lifecycle, and a flagged list of any security-relevant 
findings marked 🔴 SECURITY at the top regardless of other severity.
```

---

## 🚀 PHASE 4 — ONBOARDING, HOME SCREEN & DISCOVERY (SEARCH/FILTERS/SORT)

```
PHASE 4: ONBOARDING & DISCOVERY AUDIT

4.1 ONBOARDING
- First-launch experience: is there an onboarding/intro sequence? If 
  none exists, note this as a product gap (not necessarily bad — but 
  flag it as a decision point, not an oversight).
- Permission requests (notifications, location, camera/photos): are they 
  requested with a "primer" screen explaining WHY before the native OS 
  prompt, or does the OS dialog appear cold with no context? (Cold 
  permission prompts have much lower acceptance rates — flag as UX debt)
- Is there a way to complete meaningful first action (view a listing) 
  before being forced to register? Audit exact trigger point.

4.2 HOME SCREEN
- Content strategy: what determines what appears on home (algorithm, 
  static, most-recent, featured/premium)? Is loading progressive 
  (skeleton → content per section) or does the whole screen block on 
  the slowest API call?
- Personalization: does returning to home after browsing a vertical show 
  any adaptation, or is it fully static for every user?
- Pull-to-refresh: present and functional on every relevant screen, or 
  only some?

4.3 SEARCH
- Is there ONE global search or per-vertical search? If both exist, is 
  the relationship between them clear to the user?
- Debounce behavior: confirm actual debounce timing is reasonable 
  (not so fast it spams the API, not so slow it feels laggy)
- Search history / recent searches — exists? Persisted across sessions?
- Empty query state vs. zero-results state — are these visually 
  distinguished, or identical (confusing to users)?
- Does search span title only, or title+description+seller name? Is 
  this documented/consistent per vertical?

4.4 FILTERS
- Catalog every filter available per vertical (price range, condition, 
  location, category-specific specs like transmission/fuel for cars, 
  weight capacity for equipment, etc.)
- Filter persistence: do selected filters survive navigating away and 
  back, or reset every time?
- Filter UI pattern: bottom sheet, modal, or inline — confirm ONE pattern 
  is used everywhere (flag if it varies by vertical)
- Combining filters: can a user apply 3+ filters simultaneously without 
  the UI breaking or the query failing silently?
- "Clear all filters" — exists and works?

4.5 SORT
- What sort options exist (newest, price asc/desc, distance, relevance)? 
  Confirmed working for EACH vertical, or only implemented for one and 
  copy-pasted UI elsewhere that doesn't actually sort?
- Default sort — sensible for each vertical (e.g., Jobs might default to 
  newest, Transport quotes might default to price)?

Output: `AUDIT_PHASE_4_DISCOVERY.md` with a filter/sort feature matrix per 
vertical, and specific repro steps for any broken filter/sort combination 
found.
```

---

## 📋 PHASE 5 — LISTINGS, MEDIA & USER-GENERATED CONTENT

```
PHASE 5: LISTINGS, DETAIL PAGES & MEDIA AUDIT

5.1 LISTING CREATION (POST FLOW)
- Trace the full multi-step post flow for EACH vertical (step1...step5 
  or however many steps exist per type). Note where steps diverge or 
  where a shared step (e.g., location picker, image upload) behaves 
  differently per vertical.
- Draft persistence: if the user backgrounds the app or loses connection 
  mid-way through a multi-step post, is progress saved (locally or 
  server-side draft), or lost entirely?
- Validation: is validation consistent (same min/max rules, same error 
  message style) across all forms, or does each vertical's form have 
  its own validation quirks?
- Required vs optional fields: are they clearly marked? Does the submit 
  button stay disabled with a clear reason, or does it submit and fail 
  with a generic error?

5.2 IMAGE/MEDIA HANDLING
- Upload flow: single vs. multi-image upload — what's the max image 
  count per listing, and is this limit enforced client-side with 
  clear feedback?
- Compression: are images compressed/resized client-side before upload 
  (bandwidth/cost concern), or uploaded at full camera resolution? 
  Check for any resize/quality logic in the upload path.
- Reordering: can users reorder uploaded images (to set the cover 
  photo)? 
- Upload failure handling: if one image in a batch fails, does the 
  whole submission fail, or does it gracefully skip/retry that one?
- Video support: does any vertical support video listings, and if so, 
  is there a duration/size limit communicated?
- Image viewer: full-screen gallery view — pinch-to-zoom, swipe between 
  images, and does it correctly handle a listing with only 1 image 
  (no broken swipe indicators)?

5.3 LISTING DETAIL PAGE
- Compare the detail page structure across verticals — is there a 
  shared template with vertical-specific fields injected, or fully 
  separate implementations per vertical (maintenance risk)?
- Map display: does the location map render correctly, degrade 
  gracefully on web/if maps fail to load, and respect user's map 
  permission state?
- Contact/action CTA: confirm "Contact Seller" (or vertical-equivalent 
  like "Request Quote" for Transport, "Apply" for Jobs) is present and 
  wired on EVERY vertical's detail page — this was flagged missing in 
  a prior audit for some verticals, verify current state.
- Share listing: exists? Deep link correctly to the specific listing 
  when shared externally?
- Related/similar listings section — present, and does tapping one 
  navigate correctly without breaking the back stack?

5.4 FAVORITES
- Confirm favorite toggle exists on: card view, detail view, AND persists 
  correctly between the two (favoriting from detail should reflect 
  instantly on the card if user navigates back)
- Favorites list screen: does it correctly handle a favorited item that 
  was later deleted/sold by its owner (graceful "no longer available" 
  state vs. crash/blank)?
- Cross-vertical favorites list: does it correctly group/filter/badge 
  items by vertical, or dump everything in one undifferentiated list?

Output: `AUDIT_PHASE_5_LISTINGS_MEDIA.md` with per-vertical post-flow 
diagrams, image pipeline findings, and a definitive answer on which 
verticals have working Contact/Favorite actions vs. which don't.
```

---

## 💬 PHASE 6 — CHAT, NOTIFICATIONS, PROFILES & TRUST (REVIEWS)

```
PHASE 6: COMMUNICATION & TRUST SYSTEMS AUDIT

Note: Chat already has dedicated audits (CHAT_AUDIT.md, CHAT_UI_UX_AUDIT.md) 
— reference those findings rather than re-deriving them, but DO verify 
whether any of those fixes have since been applied, and note current state.

6.1 NOTIFICATIONS (bigger picture beyond chat)
- Push notification categories: what events trigger a push (new message, 
  listing sold, offer received, verification approved, price drop on 
  favorite, etc.)? Which of these are actually implemented vs. aspirational?
- Permission flow: primer screen before OS prompt? What happens if user 
  denies — is there a way to re-prompt later (e.g., from Settings) with 
  guidance?
- In-app notification center: exists as a screen? Does it mark-as-read 
  correctly, deep-link to the right context, and paginate for high-
  volume users?
- Notification preferences: can users opt out of categories (e.g., 
  marketing pushes but keep chat pushes)?
- Badge count: app icon badge and in-app tab badge — do they stay in 
  sync, and clear correctly when the relevant content is viewed?

6.2 USER & SELLER PROFILES
- Profile completeness: what fields exist (name, avatar, phone, bio, 
  member-since, verification badges)? Is there a meaningful difference 
  between viewing your OWN profile vs. another user's public profile?
- Seller-specific info: does a seller's profile show their active 
  listings count, response rate/time, join date — signals that build 
  buyer trust? If missing, flag as a trust-building gap.
- Editing profile: what's editable, and is there validation (phone 
  format for Oman +968, etc.)?
- Carrier/Driver profile variants (Transport/Jobs): do these show 
  vertical-specific trust signals (vehicle type, license status, 
  completed jobs count)?

6.3 REVIEWS & RATINGS
- Confirm current implementation state (prior audit found 0% — verify 
  if anything has changed).
- If still missing: define exactly what's needed — trigger point (after 
  transaction? after chat closes? manual from profile?), rating scale, 
  one-directional (buyer rates seller) or bidirectional?
- Aggregate rating display: average rating + count shown on seller 
  profile AND on their listing cards? Consistent placement across 
  verticals?
- Fake/spam review protection: any rate-limiting or one-review-per-
  transaction enforcement referenced in the API layer?

6.4 TRUST & SAFETY (cross-cutting)
- Report user / report listing: does this exist anywhere in the mobile 
  app? This is often an App Store/Play Store requirement for marketplace/
  UGC apps — flag as a submission risk if entirely absent.
- Block user: exists? Does blocking a user also hide/prevent their 
  messages from reappearing?
- Scam/fraud warning banners: any in-app education (e.g., "never pay 
  before inspecting the item")? Common in marketplace apps to reduce 
  liability.

Output: `AUDIT_PHASE_6_TRUST_COMMUNICATION.md` — cross-reference existing 
chat audits, add net-new findings on notifications/profiles/reviews/safety, 
and give a clear trust-system maturity score (0-10) with justification.
```

---

## 💳 PHASE 7 — MONETIZATION, PERMISSIONS (GPS) & RESILIENCE (OFFLINE/ERRORS)

```
PHASE 7: MONETIZATION, PERMISSIONS & RESILIENCE AUDIT

7.1 PACKAGES & SUBSCRIPTIONS
- Enumerate every subscription tier/package referenced in the UI 
  (profile/subscription.tsx and anywhere else). What does each tier 
  actually unlock (listing limits, premium placement, badge)?
- Purchase flow: does tapping "Subscribe" lead to an actual payment 
  flow, or a dead end / "coming soon"?
- Active subscription state: is it clearly shown (expiry date, 
  auto-renew status)? Cancellation flow — exists?

7.2 PAYMENTS (Thawani integration)
- Where is payment actually triggered in the mobile app currently 
  (if anywhere)? Trace the full flow: initiate → Thawani checkout → 
  callback/webhook → success/failure screen → order record.
- Failure handling: declined card, timeout, user cancels mid-payment — 
  does the app recover to a sane state, or leave the user unsure if 
  they were charged?
- Coupon/discount codes: input field exists anywhere in a purchase 
  flow? Validated client-side, server-side, or not at all?
- Receipt/invoice: after successful payment, is there any confirmation 
  screen or record accessible later (payment history)?

7.3 MAPS & GPS PERMISSIONS
- Every screen using location (nearby listings, transport pickup/
  dropoff, carrier location): confirm graceful handling of all 3 
  permission states — granted, denied, and "denied, don't ask again."
- Is there a manual location entry/search fallback when GPS permission 
  is denied, or does the feature become entirely unusable?
- Background location: is it requested anywhere (should almost 
  certainly NOT be needed for this app — flag if it is, as it invites 
  App Store rejection and privacy concern)
- Map performance: any lag/jank when many pins render at once (relevant 
  for Transport carrier maps or listing-near-me views)?

7.4 OFFLINE MODE
- What's the actual behavior when the device has no network at launch 
  vs. loses network mid-session? Test both.
- Cached content: does previously-viewed content (listings, chat 
  history) remain visible offline, or does everything blank out?
- Write actions while offline (post listing, send message, favorite): 
  queued for retry, or silently fail / show a generic error?
- Reconnection: when network returns, does the app auto-refresh stale 
  data, or does the user have to manually pull-to-refresh everywhere?

7.5 LOADING, EMPTY & ERROR STATES (systemic pass)
- Catalog every distinct loading state pattern used across the app 
  (spinner vs skeleton vs shimmer) — is ONE pattern used consistently, 
  or does it vary screen to screen?
- Empty states: confirm every list/grid screen has a purpose-built 
  empty state (not just blank white space) — cross-reference against 
  the per-vertical gaps found in Phase 1.
- Error/retry pattern: when an API call fails, is there a consistent 
  "Something went wrong — Retry" component reused everywhere, or is 
  error handling ad-hoc per screen (some show alerts, some show inline 
  text, some show nothing)?
- Toast/snackbar system: is there a global one, or do success/error 
  messages appear inconsistently (Alert.alert in some places, custom 
  toast in others)?

Output: `AUDIT_PHASE_7_MONETIZATION_RESILIENCE.md` with explicit pass/
fail on "can this app process a real payment end to end today" and a 
resilience score covering offline + error handling maturity.
```

---

## ✅ PHASE 8 — FINAL RELEASE READINESS CHECKLIST (GO/NO-GO)

```
PHASE 8: RELEASE READINESS — GO/NO-GO CHECKLIST

You now have findings from Phases 1-7. Synthesize them into a SINGLE 
release checklist. This is the document a founder/PM reads 10 minutes 
before deciding to submit to the App Store / Play Store.

Structure the checklist in these sections. Every line item must resolve 
to one of: 🟢 GREEN (ready) / 🟡 YELLOW (works but degraded, ship with 
known limitation) / 🔴 RED (blocker — must fix before submission).

### A. Core Transaction Loop (per vertical)
- [ ] Cars: browse → detail → contact → (payment if applicable) works end-to-end
- [ ] Buses: same
- [ ] Equipment: same
- [ ] Spare Parts: same
- [ ] Jobs: browse → apply → employer contact works end-to-end
- [ ] Services: browse → detail → contact works end-to-end
- [ ] Transport: request → quote → accept → booking works end-to-end

### B. Trust & Safety (App Store/Play Store submission requirements)
- [ ] Delete account flow exists and works
- [ ] Report user/listing exists
- [ ] Block user exists
- [ ] Privacy policy accessible in-app
- [ ] Terms of service accessible in-app
- [ ] Data collection disclosed matches actual behavior (for store listing)

### C. Auth & Security
- [ ] Tokens stored in SecureStore, not AsyncStorage
- [ ] 401 handling is global and consistent
- [ ] Logout clears all local state completely
- [ ] No hardcoded secrets/API keys in the client bundle

### D. Payments
- [ ] Full payment flow tested with real Thawani sandbox transaction
- [ ] Failure/decline states handled gracefully
- [ ] No way to double-charge via double-tap/double-submit

### E. Core UX
- [ ] Search works and returns relevant results on all verticals
- [ ] Filters persist and combine correctly
- [ ] Favorites sync correctly between list/detail/favorites screen
- [ ] Chat sends/receives reliably (per existing chat audit fixes)
- [ ] Empty/loading/error states exist on every list-type screen

### F. Design & Accessibility
- [ ] Design system tokens used consistently (no major literal-value drift)
- [ ] All tap targets ≥44x44pt
- [ ] RTL layout verified correct on at least: home, listing detail, 
      chat, profile, post-flow
- [ ] Tested on smallest supported device (iPhone SE / small Android) 
      and largest (iPad/tablet if supported)

### G. Performance & Resilience
- [ ] App usable (core browse loop) with no network at all
- [ ] No memory leaks in chat/socket connections (per chat audit)
- [ ] Cold start time is acceptable (<3s to interactive, note actual 
      measured time)
- [ ] No crash on any of the top 5 user flows under normal use

### H. Notifications & Permissions
- [ ] Push notifications delivered and deep-link correctly for at 
      least: new message, listing status change
- [ ] Location permission has graceful denied-state fallback
- [ ] Camera/photo library permission has graceful denied-state fallback

### I. Content & Business Logic
- [ ] Reviews/ratings system live OR explicit product decision documented 
      that it's post-launch
- [ ] Listing status (sold/expired/archived) reflected immediately 
      everywhere it's shown
- [ ] Subscription/package gating actually enforced, not just displayed

---

Finally, produce a ONE-PARAGRAPH executive summary answering: 
"Is this app ready to submit to app stores today? If not, what are the 
top 5 blockers, and what's the realistic time estimate to clear them?"

Output: `AUDIT_PHASE_8_RELEASE_CHECKLIST.md` — this is the master 
document. Link back to all Phase 1-7 reports for detail on each 🔴/🟡 item.
```

---

## 📎 APPENDIX — HOW TO SEQUENCE THIS WITH CLAUDE CODE

1. Paste **Phase 0** in a fresh Claude Code session in the `souqoneapp` repo. 
   Wait for confirmation.
2. Paste **Phase 1** in the same session (or a new one, referencing 
   Phase 0's role setup again briefly). Let it finish and review 
   `AUDIT_PHASE_1_PRODUCT.md` before moving on.
3. Repeat for Phases 2–7, in order. If a phase surfaces something urgent 
   (e.g., a security issue in Phase 3), it's fine to pause and fix before 
   continuing — the audit doesn't need to be 100% sequential-only, but 
   Phase 8 assumes all prior phases have at least been *run* (findings 
   don't need to be *fixed* yet, just documented).
4. Run **Phase 8** last, after all 7 phase reports exist. This is the 
   synthesis step and needs the prior context to be meaningful.

**Time estimate:** Phases 1-2 (~2-3 hrs each of Claude Code time), 
Phases 3-7 (~1.5-2 hrs each), Phase 8 (~1 hr synthesis). Budget a full 
week if running phases across multiple days with review time between each.
