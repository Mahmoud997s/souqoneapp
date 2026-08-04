# 🚀 PHASE 4B — Mobile: Fix Typing Signal + Add Real Online Status
## Prompt for Claude Code — souqoneapp (Expo) repo

---

## 📌 HOW TO USE THIS FILE

Paste this entire file to Claude Code, opened inside the `souqoneapp` 
repo. This is independent of and can be done in parallel with 
Phase 4A (backend, a different repo) — neither blocks the other, 
though the backend phase should also be deployed for full reliability.

---

## 🎯 ROLE & CONTEXT

```
You are fixing two chat bugs in the SouqOne Expo mobile app, found by 
comparing this app's chat code against the web app's chat code 
(apps/web in the backend monorepo, a different repo — read-only 
reference, not something you'll edit).

BUG 1 — Wrong event name breaks the "stop typing" signal.
`src/hooks/useChatRoomLogic.ts` emits `'user-stop-typing'` to the 
server when the user stops typing:
    getSocket()?.emit('user-stop-typing', { conversationId: roomId })
But the backend only listens for `'stop-typing'` (confirmed in the 
backend's `chat.gateway.ts`: `@SubscribeMessage('stop-typing')`). 
`'user-stop-typing'` is actually the event name the SERVER broadcasts 
TO other clients, not what it expects to receive FROM the sender — this 
app is emitting the wrong direction's event name. The result: the 
"stop typing" signal never reaches the server, so the other 
participant's typing indicator only clears via its own local 3-second 
timeout instead of clearing immediately when typing actually stops.

BUG 2 — Online status is hardcoded, not real.
`app/chat/[id].tsx` renders this unconditionally, with no state, no 
data, no logic at all:
    <View style={s.onlineBadge} />
This green dot appears on every chat regardless of whether the other 
person is actually online. The backend already supports checking real 
online status — the web app already uses it correctly:
    // apps/web/src/features/chat/hooks/use-chat-room.ts
    if (other) connectSocket().emit('check-online', { userId: other.id });
    socket.on('online-status', onOnlineStatus);
This app has ZERO code referencing `check-online` or `online-status` 
anywhere — the feature was never wired on mobile at all.

YOUR JOB THIS PHASE:
1. Fix the wrong event name for stop-typing (one-line fix, two spots)
2. Add real online-status checking, following the exact same 
   request/response pattern the web app already uses — request status 
   once when the chat room opens, store it in state, and bind the 
   badge's visibility to that state instead of always rendering it

SCOPE BOUNDARIES:
- Do NOT touch the backend (souqOneOm) — it already has everything 
  needed for both fixes; this is purely a mobile-side wiring gap
- Do NOT build a live-updating presence system (e.g. auto-refreshing 
  online status every few seconds, or subscribing to presence change 
  events) — the backend doesn't currently broadcast presence changes, 
  only responds to on-demand checks. Match the web app's simpler 
  "check once when the chat opens" behavior. If continuous presence 
  updates are wanted later, that requires backend changes too and 
  should be a separate, explicitly-scoped task.
```

---

## SPEC 1 — Fix the Stop-Typing Event Name

**File:** `src/hooks/useChatRoomLogic.ts`

**Find both occurrences of this (there are two — one in `handleSend`, 
one in `handleTextChange`'s auto-stop timeout):**
```typescript
getSocket()?.emit('user-stop-typing', { conversationId: roomId })
```

**Replace both with:**
```typescript
getSocket()?.emit('stop-typing', { conversationId: roomId })
```

**Do NOT change** the listener registration a few lines away:
```typescript
socket.on('user-stop-typing', onUserStopTyping)
```
This one is correct as-is — `'user-stop-typing'` is what the SERVER 
broadcasts to the OTHER participant, which is different from what THIS 
client sends TO the server. Only the two `.emit(...)` calls need the 
name changed, not the `.on(...)` listener.

**Verification:** With two test devices/simulators in the same 
conversation, start typing on device A, then stop. Confirm device B's 
"يكتب الآن..." indicator disappears within roughly 1 second of A 
stopping, not only after the full 3-second local timeout.

---

## SPEC 2 — Real Online Status

**File:** `src/hooks/useChatRoomLogic.ts`

**Add new state**, alongside the existing `isOtherUserTyping` state 
declaration:
```typescript
const [isOtherUserOnline, setIsOtherUserOnline] = useState(false)
```

**Inside the main `useEffect` that sets up socket listeners** (the same 
one where `join-conversation` is emitted and `user-typing`/
`user-stop-typing`/etc. listeners are attached), add a listener for the 
response:
```typescript
const onOnlineStatus = (data: { userId: string; online: boolean }) => {
  if (data.userId === otherUser?.id) {
    setIsOtherUserOnline(data.online)
  }
}
attachListener('online-status', onOnlineStatus)
```
(Use whatever the existing helper for tracked listener attachment is 
called in this file — it was introduced during the earlier memory-leak 
fix phase; follow that same pattern for cleanup consistency, don't 
register with a bare `socket.on(...)` if the rest of this effect uses 
a tracked-attach helper.)

**Then emit the check itself**, once the socket is connected and the 
other user's ID is known. Inspect this file's current structure first — 
`otherUser` may be fetched separately/asynchronously and not yet 
available at the exact point where `join-conversation` is emitted. If 
so, use a small dedicated effect instead of forcing it into the main 
one:
```typescript
useEffect(() => {
  const socket = getSocket()
  if (socket?.connected && otherUser?.id) {
    socket.emit('check-online', { userId: otherUser.id })
  }
}, [otherUser?.id])
```
Pick whichever placement fits this file's actual structure without 
duplicating the online-status listener registration.

**Return the new state** from the hook, alongside the existing returns:
```typescript
return {
  // ...existing fields...
  isOtherUserOnline,
}
```

**File:** `app/chat/[id].tsx`

**Destructure the new field** from the hook call:
```typescript
const {
  // ...existing destructured fields...
  isOtherUserOnline,
} = useChatRoomLogic(id ?? '', initialText, otherUserName, otherUserAvatar)
```

**Replace the unconditional badge:**
```typescript
<View style={s.onlineBadge} />
```
**With a conditional one:**
```typescript
{isOtherUserOnline && <View style={s.onlineBadge} />}
```

**Verification:** 
1. Open a chat where the other participant is genuinely offline (their 
   app fully closed / logged out) — confirm the green dot does NOT 
   appear
2. Have the other participant open the app and connect — reopen or 
   re-enter the chat screen — confirm the dot DOES appear now
3. Confirm this doesn't break anything if `otherUser` is briefly `null` 
   while the screen first loads (no crash, badge just doesn't show 
   until data arrives, same pattern already used for the typing 
   indicator elsewhere in this file)

---

## ✅ FINAL ACCEPTANCE CHECKLIST

- [ ] Both `'user-stop-typing'` emit calls changed to `'stop-typing'`
- [ ] The `.on('user-stop-typing', ...)` listener was NOT changed — 
      still correct as-is
- [ ] `check-online` is emitted once the other participant's ID is 
      known and the socket is connected
- [ ] `online-status` response is captured and stored in new 
      `isOtherUserOnline` state
- [ ] The green online badge only renders when `isOtherUserOnline` is 
      true — no more unconditional badge
- [ ] No new continuous polling/interval was added — matches the 
      simpler "check once on open" behavior the web app already uses
- [ ] Type-check / build passes with no new errors

---

## 📎 NOTE ON RELATED BACKEND WORK

A separate phase (Phase 4A, a different prompt, the `souqOneOm` repo) 
fixes a Redis reliability issue that can cause messages, reactions, and 
read receipts to not appear live even when everything on the mobile 
side is correct. That phase is independent of this one and doesn't 
need to be done first — but if live delivery still feels unreliable 
after this mobile phase is deployed, that backend phase is very likely 
why, and should be checked next.
