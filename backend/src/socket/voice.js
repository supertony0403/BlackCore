// Voice Channel Signaling via WebRTC (Peer-to-Peer)
// STUN: Google Public Servers (kein eigenes Hosting)
const voiceRooms = new Map(); // channelId => Set<socketId>

export function registerVoiceHandlers(io, socket) {
  socket.on('voice:join', ({ channelId }) => {
    const room = `voice:${channelId}`;
    const existing = [...(voiceRooms.get(channelId) || [])];
    socket.join(room);

    if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Set());
    voiceRooms.get(channelId).add(socket.id);

    existing.forEach(peerId => {
      socket.emit('voice:peer-joined', { peerId });
      io.to(peerId).emit('voice:peer-joined', { peerId: socket.id });
    });

    socket.on('disconnect', () => {
      voiceRooms.get(channelId)?.delete(socket.id);
      io.to(room).emit('voice:peer-left', { peerId: socket.id });
    });
  });

  socket.on('voice:signal', ({ peerId, signal }) => {
    io.to(peerId).emit('voice:signal', { peerId: socket.id, signal });
  });

  socket.on('voice:leave', ({ channelId }) => {
    const room = `voice:${channelId}`;
    socket.leave(room);
    voiceRooms.get(channelId)?.delete(socket.id);
    io.to(room).emit('voice:peer-left', { peerId: socket.id });
  });
}
