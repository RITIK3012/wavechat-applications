// ENV_MODE: "challenge_strict"
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as IOServer } from 'socket.io';

import CONFIG from './config';

const app = express();
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(cors({ origin: '*' }));
app.use(router);

const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_chat', (connectionId: string) => {
    const room = io.sockets.adapter.rooms.get(connectionId);
    const numClients = room ? room.size : 0;

    if (numClients >= 2) {
      socket.emit('error_message', 'Chat is full. Please try another connection ID.');
      return;
    }

    socket.join(connectionId);
    console.log(`User ${socket.id} joined room: ${connectionId}`);

    if (numClients + 1 === 2) {
      io.to(connectionId).emit('chat_start');
    }
  });

  socket.on('send_message', (data: { connectionId: string, message: string }) => {
    const { connectionId, message } = data;
    socket.to(connectionId).emit('receive_message', {
      message,
      senderId: socket.id
    });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('chat_end');
        console.log(`User ${socket.id} left room ${room}, ending chat.`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(CONFIG.PORT, () => {
  console.log(`Server listening on *:${CONFIG.PORT}`);
});