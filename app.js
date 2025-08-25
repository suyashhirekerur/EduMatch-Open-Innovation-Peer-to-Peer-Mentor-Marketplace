// Install dependencies: npm install express socket.io
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for hackathon simplicity
        methods: ["GET", "POST"]
    }
});

const PORT = 5000;

// Simple room management (in a real app, use a database)
const rooms = {}; // Map: { roomId: [socketId1, socketId2, ...] }
const peers = {}; // Map: { socketId: roomId }

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- 1. Joining a Room ---
    socket.on('joinRoom', (roomId, callback) => {
        if (!roomId || !socket.id) return;

        // Ensure the room exists and has at most one other peer (P2P call)
        if (rooms[roomId] && rooms[roomId].length >= 2) {
            callback({ success: false, message: 'Room is full' });
            return;
        }

        // Leave any existing room first
        if (peers[socket.id]) {
            socket.leave(peers[socket.id]);
        }

        socket.join(roomId);
        peers[socket.id] = roomId;
        rooms[roomId] = rooms[roomId] || [];
        
        if (!rooms[roomId].includes(socket.id)) {
            rooms[roomId].push(socket.id);
        }

        console.log(`User ${socket.id} joined room ${roomId}`);

        // Notify the new peer if there's already an existing peer
        const otherPeerId = rooms[roomId].find(id => id !== socket.id);
        if (otherPeerId) {
            console.log(`Notifying ${otherPeerId} about new peer ${socket.id}`);
            // Send the 'userJoined' signal to the existing peer
            socket.to(otherPeerId).emit('userJoined', socket.id);
        }
        
        callback({ success: true, otherPeerId: otherPeerId });
    });

    // --- 2. Signaling Messages (Offer, Answer, ICE Candidates) ---
    // Pass the WebRTC signal to the target peer in the room
    socket.on('signal', (data) => {
        const { to, signal } = data;
        
        if (to && signal) {
            console.log(`Relaying signal from ${socket.id} to ${to}`);
            // Relay the signal to the specified target peer
            socket.to(to).emit('signal', {
                from: socket.id,
                signal: signal
            });
        }
    });

    // --- 3. Disconnection ---
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const roomId = peers[socket.id];
        
        if (roomId && rooms[roomId]) {
            // Remove the user from the room list
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            
            // Notify the other peer about the disconnection
            const otherPeerId = rooms[roomId][0];
            if (otherPeerId) {
                console.log(`Notifying ${otherPeerId} about disconnection of ${socket.id}`);
                socket.to(otherPeerId).emit('userLeft', socket.id);
            }

            // Clean up empty room
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
        }
        delete peers[socket.id];
    });
});

server.listen(PORT, () => {
    console.log(`Signaling Server listening on http://localhost:${PORT}`);
});