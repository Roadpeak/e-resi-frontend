import { io, type Socket } from 'socket.io-client';
import { apiClient } from './client';
import { useAuthStore } from '../stores/auth.store';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  developerProfile?: { companyName?: string | null; logoUrl?: string | null } | null;
  /** Present when this party is an agent — their trading name, not a personal one. */
  agentProfile?: {
    id: string;
    displayName?: string | null;
    logoUrl?: string | null;
    photoUrl?: string | null;
  } | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: ChatUser;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  subject?: string | null;
  propertyId?: string | null;
  rentListingId?: string | null;
  /** Set when the thread is with an agent rather than about a listing. */
  agentId?: string | null;
  /** Whoever opened the thread. */
  initiator: ChatUser;
  /** Whoever was contacted. */
  counterparty: ChatUser;
  /**
   * The other side, relative to the signed-in user — computed by the API.
   * Previously each client worked this out by assuming one party was always
   * the developer, which stopped being true once agents could chat.
   */
  otherParty: ChatUser;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  lastMessageAt: string;
}

export const chatApi = {
  start: (opts: { propertySlug?: string; rentListingSlug?: string; agentId?: string }) =>
    apiClient.post<Conversation>('/chat/conversations', opts),
  list: () => apiClient.get<Conversation[]>('/chat/conversations'),
  messages: (conversationId: string) =>
    apiClient.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
  send: (conversationId: string, body: string) =>
    apiClient.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, { body }),
  unreadCount: () => apiClient.get<{ count: number }>('/chat/unread-count'),
};

const SOCKET_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api')
  .replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/** Shared /chat socket — connected lazily with the current access token. */
export function getChatSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(`${SOCKET_BASE}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function closeChatSocket() {
  socket?.disconnect();
  socket = null;
}
