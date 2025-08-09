const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Join user to their conversation rooms
  socket.on('join-conversations', (waIds) => {
    if (Array.isArray(waIds)) {
      waIds.forEach(waId => {
        socket.join(`conversation-${waId}`);
      });
      console.log(`📱 User ${socket.id} joined conversations: ${waIds.join(', ')}`);
    }
  });
  
  // Join specific conversation
  socket.on('join-conversation', (waId) => {
    socket.join(`conversation-${waId}`);
    console.log(`💬 User ${socket.id} joined conversation: ${waId}`);
  });
  
  // Leave conversation
  socket.on('leave-conversation', (waId) => {
    socket.leave(`conversation-${waId}`);
    console.log(`👋 User ${socket.id} left conversation: ${waId}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// Helper function to emit real-time updates
function emitMessageUpdate(waId, message, type = 'new-message') {
  io.to(`conversation-${waId}`).emit(type, {
    waId,
    message,
    timestamp: new Date()
  });
}

function emitConversationUpdate() {
  io.emit('conversations-updated', {
    timestamp: new Date()
  });
}

// API Routes

// Get all conversations (grouped by wa_id)
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $group: {
          _id: '$waId',
          userName: { $first: '$userName' },
          lastMessage: { $last: '$messageBody' },
          lastMessageTime: { $last: '$timestamp' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [{ $ne: ['$status', 'read'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      },
      {
        $project: {
          waId: '$_id',
          userName: 1,
          lastMessage: 1,
          lastMessageTime: 1,
          messageCount: 1,
          unreadCount: 1,
          _id: 0
        }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
app.get('/api/conversations/:waId/messages', async (req, res) => {
  try {
    const { waId } = req.params;
    const messages = await Message.find({ waId })
      .sort({ timestamp: 1 })
      .select('messageId messageBody messageType direction status timestamp userName');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation info
app.get('/api/conversations/:waId/info', async (req, res) => {
  try {
    const { waId } = req.params;
    const conversation = await Message.findOne({ waId })
      .select('waId userName displayPhoneNumber')
      .sort({ timestamp: -1 });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      waId: conversation.waId,
      userName: conversation.userName,
      phoneNumber: conversation.displayPhoneNumber || waId
    });
  } catch (error) {
    console.error('Error fetching conversation info:', error);
    res.status(500).json({ error: 'Failed to fetch conversation info' });
  }
});

// Send a new message (demo - saves to database only)
app.post('/api/conversations/:waId/messages', async (req, res) => {
  try {
    const { waId } = req.params;
    const { messageBody } = req.body;

    if (!messageBody || messageBody.trim() === '') {
      return res.status(400).json({ error: 'Message body is required' });
    }

    // Get user info from existing conversation
    const existingMessage = await Message.findOne({ waId }).sort({ timestamp: -1 });
    if (!existingMessage) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create new outgoing message
    const newMessage = new Message({
      messageId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metaMsgId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      waId: waId,
      userName: existingMessage.userName,
      messageType: 'text',
      messageBody: messageBody.trim(),
      direction: 'outgoing',
      status: 'sent',
      timestamp: new Date(),
      phoneNumberId: existingMessage.phoneNumberId,
      displayPhoneNumber: existingMessage.displayPhoneNumber
    });

    await newMessage.save();

    // Emit real-time update for new message
    const messageData = {
      messageId: newMessage.messageId,
      messageBody: newMessage.messageBody,
      messageType: newMessage.messageType,
      direction: newMessage.direction,
      status: newMessage.status,
      timestamp: newMessage.timestamp,
      userName: newMessage.userName
    };
    
    emitMessageUpdate(waId, messageData, 'new-message');
    emitConversationUpdate();

    res.status(201).json({
      success: true,
      message: messageData
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
app.put('/api/conversations/:waId/mark-read', async (req, res) => {
  try {
    const { waId } = req.params;
    
    const result = await Message.updateMany(
      { waId: waId, direction: 'incoming', status: { $ne: 'read' } },
      { status: 'read', statusUpdatedAt: new Date() }
    );

    // Emit real-time status update if messages were updated
    if (result.modifiedCount > 0) {
      io.to(`conversation-${waId}`).emit('messages-read', {
        waId,
        timestamp: new Date()
      });
      emitConversationUpdate();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 WhatsApp Web Clone with Socket.IO is ready!`);
  console.log(`⚡ Real-time messaging enabled`);
});