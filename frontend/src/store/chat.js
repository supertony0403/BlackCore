import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  servers: [],
  channels: [],
  messages: {},
  activeServer: null,
  activeChannel: null,
  onlineUsers: new Set(),
  typingUsers: {},

  setServers: (servers) => set({ servers }),
  setChannels: (channels) => set({ channels }),
  setActiveServer: (server) => set({ activeServer: server }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  setMessages: (channelId, messages) => set(state => ({
    messages: { ...state.messages, [channelId]: messages }
  })),

  addMessage: (channelId, message) => set(state => ({
    messages: {
      ...state.messages,
      [channelId]: [...(state.messages[channelId] || []), message]
    }
  })),

  setUserOnline: (userId) => set(state => ({
    onlineUsers: new Set([...state.onlineUsers, userId])
  })),

  setUserOffline: (userId) => set(state => {
    const next = new Set(state.onlineUsers);
    next.delete(userId);
    return { onlineUsers: next };
  }),

  setTyping: (channelId, userId) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [channelId]: [...new Set([...(state.typingUsers[channelId] || []), userId])]
      }
    }));
    setTimeout(() => {
      set(state => ({
        typingUsers: {
          ...state.typingUsers,
          [channelId]: (state.typingUsers[channelId] || []).filter(id => id !== userId)
        }
      }));
    }, 3000);
  }
}));
