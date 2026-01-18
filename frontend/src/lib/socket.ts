import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

let socket: Socket | null = null;

export const getSocket = (userId?: string): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        if (userId) {
            socket.emit('register', userId);
        }
    } else if (userId && (socket as any).userId !== userId) {
        socket.emit('register', userId);
        (socket as any).userId = userId;
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
