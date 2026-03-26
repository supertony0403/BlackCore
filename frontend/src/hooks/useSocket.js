import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useChatStore } from '../store/chat.js';
import { useAuthStore } from '../store/auth.js';

let socketInstance = null;

export function useSocket() {
  const token = useAuthStore(s => s.token);
  const { addMessage, setUserOnline, setUserOffline, setTyping } = useChatStore();

  useEffect(() => {
    if (!token || socketInstance) return;

    socketInstance = io('/', { auth: { token }, transports: ['websocket'] });

    socketInstance.on('message:new', (msg) => {
      addMessage(msg.channel_id, msg);
    });

    socketInstance.on('user:online', ({ userId }) => setUserOnline(userId));
    socketInstance.on('user:offline', ({ userId }) => setUserOffline(userId));
    socketInstance.on('typing:update', ({ channelId, userId }) => setTyping(channelId, userId));

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
    };
  }, [token]);

  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}
