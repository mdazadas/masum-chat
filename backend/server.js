const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, specify your frontend URL
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: '*', // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// User ID to Socket ID mapping
const users = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register user
    socket.on('register', (userId) => {
        users.set(userId, socket.id);
        socket.userId = userId;
        console.log(`User ${userId} registered with socket ${socket.id}`);

        // Broadcast to all clients that this user is now online
        io.emit('user-online', { userId });
    });

    // Handle signaling for calls
    socket.on('call-user', (data) => {
        const { to, offer, from, callerName, type, chatId, callId } = data;
        const targetSocketId = users.get(to);
        if (targetSocketId) {
            console.log(`Sending call offer from ${from} to ${to}, callId: ${callId}`);
            io.to(targetSocketId).emit('incoming-call', {
                from,
                offer,
                callerName,
                type, // 'video' or 'audio'
                chatId,
                callId
            });
        }
    });

    socket.on('answer-call', (data) => {
        const { to, answer } = data;
        const targetSocketId = users.get(to);
        if (targetSocketId) {
            console.log(`Sending answer to ${to}`);
            io.to(targetSocketId).emit('call-answered', {
                answer
            });
        }
    });

    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;
        const targetSocketId = users.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('ice-candidate', {
                candidate
            });
        }
    });

    socket.on('end-call', (data) => {
        const { to } = data;
        const targetSocketId = users.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-ended');
        }
    });

    socket.on('reject-call', (data) => {
        const { to } = data;
        const targetSocketId = users.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-rejected');
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            const userId = socket.userId;
            users.delete(userId);
            console.log(`User ${userId} disconnected`);

            // Broadcast to all clients that this user is now offline
            io.emit('user-offline', { userId });
        }
    });
});

// Basic health check route
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Masum Chat Socket Server is active!',
        connectedUsers: users.size
    });
});

// Get list of online users
app.get('/online-users', (req, res) => {
    const onlineUserIds = Array.from(users.keys());
    res.json({ onlineUsers: onlineUserIds });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
});
