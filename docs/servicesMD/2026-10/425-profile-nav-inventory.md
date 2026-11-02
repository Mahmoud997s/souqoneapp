قريت الدستور v1.2 — المستوى: 🟡 — الريبو: mobile — SHA-256: 7E875E211892CF1EEDF27A30CE0788DFAB16EADC6343C0A17B176904642294AC
---
task: I-008
status: INVENTORY_COMPLETE
repo: mobile
branch: feat/browse-nav-glass-ice
head: a3c6b5426a7d95c3fba2381c2bafacc03d2b23c3
date: 2026-11-02
---

# I-008 pre-change navigation inventory

This is the required Step 0 inventory. No source code was changed while producing it. The I-008 instructions now say to make AppHeader glass the global default. The worktree is on the named branch at the exact remote head verified with git ls-remote: a3c6b5426a7d95c3fba2381c2bafacc03d2b23c3.

## AppHeader usage and impact

The exact search returned nine importing/using files: seven active route files, ProfilePhoneGuardView, and BrowseHeader.

| Route / screen | Header | Theme | Back, title, slots/actions | Current appearance and impact |
| --- | --- | --- | --- | --- |
| app/post/step2.tsx | AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| app/post/step3.tsx | AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| app/post/step4.tsx | AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| app/post/step5.tsx | AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| app/profile/notifications.tsx (error and loaded states) | AppHeader | dark default | back + title; loaded state has right action slot to mark all read | Existing gradient/grid; global glass default changes it; preserve action |
| app/profile/subscription.tsx | AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| app/reviews/[entityId].tsx | AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| app/post/step2.tsx phone-guard state through ProfilePhoneGuardView headerVariant=app | ProfilePhoneGuardView -> AppHeader | dark default | back + title | Existing gradient/grid; global glass default changes it |
| Six browse routes: app/{buses,cars,equipment,parts,services}/browse.tsx and app/equipment/operators/browse.tsx | BrowseHeader -> AppHeader | light | left back slot, center search slot, right filter slot | Already opts into TopBarGlassSurface and ice controls; no visual change from changing AppHeader's default. I-007b fixes this search input's RTL separately. |

AppHeader's current theme defaults to dark. For glass mode, its title and icon controls must become legible on the pale glass surface; the back and right-icon controls must use the same iceGlass control surface as Home, not retain the old dark-theme translucent fill. The explicit glassBackground=false escape hatch can preserve legacy styling where a future screen needs it.

No forbidden auth route imports AppHeader. app/profile/delete-account.tsx also does not import AppHeader; it uses GlassNavBar. Therefore the global AppHeader change does not indirectly restyle those forbidden files.

## Full active top-bar inventory

| Route / screen | Header implementation | Theme | Back, title, slots/actions | Already glass? Planned impact |
| --- | --- | --- | --- | --- |
| app/(tabs)/profile.tsx | GlassNavBar | light | back, title, chat/notifications/edit actions | GlassSurface with white wash; controls are translucent white squares, not Home's iceGlass circles. In profile scope: align with Home |
| app/profile/my-listings.tsx | GlassNavBar | light | back, title, filter/actions | Same older glass/control recipe. In profile scope: align with Home |
| app/profile/favorites.tsx | GlassNavBar | light | back, title, filter/actions | Same older glass/control recipe. In profile scope: align with Home |
| app/profile/edit-profile.tsx | GlassNavBar | light | back, title, save/message actions | Same older glass/control recipe. In profile scope: align with Home |
| app/profile/notifications.tsx | AppHeader | dark default | back, title, loaded-state right action | Global AppHeader change; preserve mark-all-read |
| app/profile/subscription.tsx | AppHeader | dark default | back, title | Global AppHeader change |
| app/profile/settings.tsx | GlassNavBar | light | back, title | Already glass but not the Home ice control recipe; outside the explicit custom-header restyle list, leave unchanged |
| app/profile/change-password.tsx | GlassNavBar | light | back, title, save action | Already glass; leave unchanged |
| app/profile/delete-account.tsx | GlassNavBar | light → Home (shared default) | back, title, retry/cancel actions | Route file remains untouched and inherits the shared GlassNavBar Home appearance; not an AppHeader user |
| app/profile/[userId].tsx | PublicProfileTopBar | light | back + centered title | GlassSurface white wash; custom, not AppHeader; leave unchanged |
| app/(tabs)/index.tsx (Home), app/{buses,cars,equipment,parts,services}/index.tsx | AnimatedHeroHeader (six route files) | light glass | back/custom right element, title/subtitle, search, chat/notification actions | Already uses GlassSurface, tint/grid, and iceGlass controls; leave unchanged |
| app/{buses,cars,equipment,equipment/operators,parts,services}/browse.tsx (six route files) | BrowseHeader | light | back, search, filter | Already uses the new glass/ice recipe; leave unchanged |
| app/{buses,cars,equipment,equipment/operators,parts,services}/new.tsx and app/equipment/operators/{add.tsx,edit/[id].tsx} | GlassNavBar; ProfilePhoneGuardView uses glass variant on new flows | light | back, title, variable actions | Older glass recipe; outside the named profile screens; leave unchanged |
| app/{buses,cars,equipment,parts,services}/drafts.tsx | DraftResumeScreen -> GlassNavBar | light | back, title, resume/delete actions | Older glass recipe; leave unchanged |
| app/{buses,cars,equipment,parts,services}/[id].tsx and app/equipment/operators/[id].tsx | Vertical detail screens -> DetailTopBar (six screen files) | light glass | back, search, share/favorite actions | Uses the established TopBarTokens and iceGlass controls; leave unchanged |
| src/components/listing-detail/DetailSkeleton.tsx | DetailTopBar | light glass | conditional back | Same shared glass recipe; leave unchanged |
| app/listings/[id].tsx | Own overlay back button and detail content header | light | back over gallery; content title/meta | Custom white circular control; not AppHeader; leave unchanged |
| app/(tabs)/search via SearchScreen | SearchHeaderBar | light glass | search + filter; no back slot | GlassSurface with top-bar tint/grid and tokenized controls; leave unchanged |
| app/(tabs)/chat via ChatHeader | ChatHeader | dark gradient | collapsible header, title/avatar/status/actions | Not glass; no AppHeader; leave unchanged |
| app/chat/[id].tsx via ChatRoomHeader | ChatRoomHeader | dark gradient | back, user title/status, optional call action | Not glass; no AppHeader; leave unchanged |
| app/(tabs)/post.tsx | Custom title header | light | centered page title; no back | Not glass; no AppHeader; leave unchanged |
| Auth routes: account-blocked, forgot-password, login, onboarding, register, reset-password, verify-email | Per-screen custom headers/brand lockup | light | Floating back/title controls or onboarding top bar; login uses brand header | No AppHeader; forbidden auth files remain untouched |
| app/(modals)/filters.tsx, app/(modals)/post-category.tsx | Custom modal headers | light | title + close/back actions | No AppHeader; leave unchanged |

Other active AppHeader users not in profile pages are the four post steps and reviews route listed above. They change because Mahmoud explicitly requested the global default. The scope excludes parked files under src/_parked; they are inactive and not Expo routes.

## Screens whose look will change

1. The seven direct AppHeader routes: four post steps, profile notifications, profile subscription, reviews.
2. The app variant of ProfilePhoneGuardView used in post step 2.
3. Four GlassNavBar profile routes explicitly named by Mahmoud: profile tab, my listings, favorites, edit profile.
4. Existing BrowseHeader routes already pass glassBackground and use ice controls, so the default change does not alter them.
5. No auth route or delete-account route-file changes: neither uses AppHeader; delete-account remains on its own GlassNavBar and inherits the shared Home appearance.

The AppHeader change must apply the same background surface and iceGlass controls in both light and dark themes, use dark readable title/icon colors on glass, keep all controls and callbacks, and retain glassBackground=false as an escape hatch. PR #80 uses Home as the shared GlassNavBar default, so callers that omit appearance—including settings, password, deletion, posting, drafts, and vertical wizard screens—inherit that appearance while their route files remain untouched.

## Source-search evidence

- git grep -l AppHeader HEAD -- app src (excluding specs, tests, and parked files): 9 files — 7 route files plus ProfilePhoneGuardView and BrowseHeader.
- git grep -l BrowseHeader: 6 active browse routes.
- git grep -l GlassNavBar: 16 source/importer files, including the route files and shared guard/draft components.
- git grep -l AnimatedHeroHeader: 6 landing routes.
- git grep -l DetailTopBar: 7 files (six detail screens and DetailSkeleton).
- git grep -l SearchHeaderBar: 1 file (SearchScreen).
- git grep -l ChatHeader: 2 files (chat tab and component); ChatRoomHeader: 2 files (chat route and component).
- git grep -l PublicProfileTopBar: 1 file (public profile route).
- git grep -n '<AppHeader|glassBackground' HEAD -- app src confirms post steps, profile notifications/subscription, reviews, BrowseHeader, AppHeader and ProfilePhoneGuardView.
- git grep -n 'ProfilePhoneGuardView' HEAD -- app shows six vertical new flows use headerVariant=glass; app/post/step2 uses headerVariant=app.
- git grep -n -i 'Floating Header|topBar|styles.header' HEAD -- auth/modals/post tab confirms their custom implementations and no shared AppHeader.
- git ls-remote origin refs/heads/feat/browse-nav-glass-ice:
  a3c6b5426a7d95c3fba2381c2bafacc03d2b23c3 refs/heads/feat/browse-nav-glass-ice
- git status --short --branch:
  ## feat/browse-nav-glass-ice...origin/feat/browse-nav-glass-ice

## Next phase

Characterization specs must be committed before source changes: default AppHeader glass surface, light and dark themes, back/no-back, right slot/icon, contrast and explicit legacy escape hatch; GlassNavBar shared Home appearance plus its explicit legacy escape hatch; smoke render coverage for affected route groups. Then change AppHeader's default and make Home the shared GlassNavBar default. No code change has started in this inventory phase.