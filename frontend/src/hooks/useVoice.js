import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from './useSocket.js';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useVoice(channelId) {
  const [peers, setPeers] = useState({});
  const [muted, setMuted] = useState(false);
  const streamRef = useRef(null);
  const peersRef = useRef({});

  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    if (!socket) return;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        streamRef.current = stream;
        socket.emit('voice:join', { channelId });

        socket.on('voice:peer-joined', ({ peerId }) => {
          const peer = new SimplePeer({
            initiator: true,
            stream,
            trickle: true,
            config: STUN_SERVERS
          });

          peer.on('signal', signal => socket.emit('voice:signal', { peerId, signal }));
          peer.on('stream', remoteStream => {
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play();
          });

          peersRef.current[peerId] = peer;
          setPeers(prev => ({ ...prev, [peerId]: peer }));
        });

        socket.on('voice:signal', ({ peerId, signal }) => {
          if (peersRef.current[peerId]) {
            peersRef.current[peerId].signal(signal);
          } else {
            const peer = new SimplePeer({
              initiator: false,
              stream,
              trickle: true,
              config: STUN_SERVERS
            });
            peer.on('signal', s => socket.emit('voice:signal', { peerId, signal: s }));
            peer.on('stream', remoteStream => {
              const audio = new Audio();
              audio.srcObject = remoteStream;
              audio.play();
            });
            peer.signal(signal);
            peersRef.current[peerId] = peer;
            setPeers(prev => ({ ...prev, [peerId]: peer }));
          }
        });

        socket.on('voice:peer-left', ({ peerId }) => {
          peersRef.current[peerId]?.destroy();
          delete peersRef.current[peerId];
          setPeers(prev => {
            const next = { ...prev };
            delete next[peerId];
            return next;
          });
        });
      })
      .catch(err => console.error('Microphone access denied:', err));

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      Object.values(peersRef.current).forEach(p => p.destroy());
      peersRef.current = {};
      setPeers({});
      socket.emit('voice:leave', { channelId });
      socket.off('voice:peer-joined');
      socket.off('voice:signal');
      socket.off('voice:peer-left');
    };
  }, [channelId]);

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = muted;
    });
    setMuted(m => !m);
  };

  return { peers, muted, toggleMute };
}
