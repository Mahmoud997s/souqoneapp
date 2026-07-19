import { z } from 'zod'

export const ChatMessageEventSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  senderId: z.string().min(1, 'Sender ID is required'),
  sender: z.object({
    id: z.string(),
    displayName: z.string().optional(),
    username: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    avatar: z.string().url().optional(),
  }).optional(),
  content: z.string()
    .max(2000, 'Message too long').optional(), // Making this optional so empty content for images is fine
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  createdAt: z.string().datetime({ message: 'Invalid date format' }).optional(),
  reactions: z.array(
    z.object({
      emoji: z.string().regex(/^(\p{Extended_Pictographic}|\p{Emoji_Component}){1}$/u),
      userId: z.string(),
      username: z.string().optional(),
    })
  ).default([]),
  isRead: z.boolean().default(false),
})

export type ValidatedChatMessage = z.infer<typeof ChatMessageEventSchema>

export const validateSocketMessage = (data: unknown): ValidatedChatMessage | null => {
  try {
    return ChatMessageEventSchema.parse(data)
  } catch (error) {
    console.error('[Socket Validation] Invalid message:', error)
    return null
  }
}

// Typing indicator
export const TypingEventSchema = z.object({
  userId: z.string(),
  conversationId: z.string(),
})

// Reaction event
export const ReactionEventSchema = z.object({
  messageId: z.string(),
  emoji: z.string().regex(/^(\p{Extended_Pictographic}|\p{Emoji_Component}){1}$/u),
  userId: z.string(),
  username: z.string().optional(),
  action: z.enum(['add', 'remove']).default('add'),
})
