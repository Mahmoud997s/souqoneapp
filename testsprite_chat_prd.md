# Chat System - Product Requirements Document (PRD)

## 1. Overview
The SouqOne Chat System allows users to communicate in real-time. It supports text messages, image attachments, reactions (emoji), unread message tracking, typing indicators, and optimistic UI updates for offline resilience.

## 2. Tech Stack
- Frontend: Expo (React Native Web supported), Zustand, Axios, Socket.io-client.
- Backend: Node.js, Socket.io, Prisma, PostgreSQL.

## 3. Features & User Interactions

### Feature 1: Real-time Messaging
- Users can type text messages and send them.
- **Interactions:** 
  1. User focuses on `chat_input_field` and types a message.
  2. User taps `chat_send_btn`.
  3. The message appears instantly on the screen (optimistic update).
  4. The message status updates from `sending` to `sent` when confirmed by the server.

### Feature 2: Typing Indicators
- Users can see when the other person is typing.
- **Interactions:**
  1. When User A types, User B sees "User A is typing..." indicator.
  2. Indicator disappears when typing stops or message is sent.

### Feature 3: Message Reactions
- Users can long-press a message to add a reaction (e.g., ❤️).
- **Interactions:**
  1. Long-press on a message bubble.
  2. Select an emoji.
  3. The reaction appears below the message for both users.

### Feature 4: Infinite Scroll (Pagination)
- Older messages are fetched automatically when the user scrolls up.
- **Interactions:**
  1. User scrolls to the top of the chat view.
  2. A loading spinner appears briefly.
  3. Older messages are prepended to the list.

### Feature 5: Image Uploads
- Users can send images via the chat.
- **Interactions:**
  1. User taps the attachment icon.
  2. User selects an image.
  3. Image uploads and appears in the chat.

## 4. Routes
- `/chat/[id]`: The main chat room view.
- `/chat`: The list of active conversations.

## 5. Known Limitations
- Sending very large video files is not fully optimized.
- If the app is fully killed, push notifications are required to resume the session smoothly.
