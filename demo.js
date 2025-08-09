const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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

// Demo data - simulating MongoDB data
let demoMessages = [
  {
    _id: '1',
    messageId: 'wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggMTIzQURFRjEyMzQ1Njc4OTA=',
    metaMsgId: 'wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggMTIzQURFRjEyMzQ1Njc4OTA=',
    waId: '919937320320',
    userName: 'Ravi Kumar',
    messageType: 'text',
    messageBody: "Hi, I'd like to know more about your services.",
    direction: 'incoming',
    status: 'read',
    timestamp: new Date('2025-01-15T12:00:00Z'),
    phoneNumberId: '629305560276479',
    displayPhoneNumber: '918329446654'
  },
  {
    _id: '2',
    messageId: 'wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=',
    metaMsgId: 'wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=',
    waId: '919937320320',
    userName: 'Ravi Kumar',
    messageType: 'text',
    messageBody: 'Thank you for your interest! We offer comprehensive digital marketing solutions.',
    direction: 'outgoing',
    status: 'read',
    timestamp: new Date('2025-01-15T12:05:00Z'),
    phoneNumberId: '629305560276479',
    displayPhoneNumber: '918329446654'
  },
  {
    _id: '3',
    messageId: 'wamid.HBgMOTI5OTY3NjczODIwFQIAEhggQ0FBQkNERUYwMDFGRjEyMzQ1NkZGQTk5RTJCM0I2NzY=',
    metaMsgId: 'wamid.HBgMOTI5OTY3NjczODIwFQIAEhggQ0FBQkNERUYwMDFGRjEyMzQ1NkZGQTk5RTJCM0I2NzY=',
    waId: '929967673820',
    userName: 'Neha Joshi',
    messageType: 'text',
    messageBody: 'Hi, I saw your ad. Can you share more details?',
    direction: 'incoming',
    status: 'delivered',
    timestamp: new Date('2025-01-15T12:16:40Z'),
    phoneNumberId: '629305560276479',
    displayPhoneNumber: '918329446654'
  },
  {
    _id: '4',
    messageId: 'demo_msg_4',
    metaMsgId: 'demo_msg_4',
    waId: '929967673820',
    userName: 'Neha Joshi',
    messageType: 'text',
    messageBody: 'Hello Neha! I\'d be happy to share more details about our services.',
    direction: 'outgoing',
    status: 'sent',
    timestamp: new Date('2025-01-15T12:20:00Z'),
    phoneNumberId: '629305560276479',
    displayPhoneNumber: '918329446654'
  },
  {
    _id: '5',
    messageId: 'demo_msg_5',
    metaMsgId: 'demo_msg_5',
    waId: '918765432109',
    userName: 'Amit Sharma',
    messageType: 'text',
    messageBody: 'Good morning! I need help with my website.',
    direction: 'incoming',
    status: 'read',
    timestamp: new Date('2025-01-15T09:30:00Z'),
    phoneNumberId: '629305560276479',
    displayPhoneNumber: '918329446654'
  },
  {
    _id: '6',
    messageId: 'demo_msg_6',
    metaMsgId: 'demo_msg_6',
    waId: '918765432109',
    userName: 'Amit Sharma',
    messageType: 'text',
    messageBody: 'Good morning Amit! I\'d be happy to help you with your website. What specific assistance do you need?',
    direction: 'outgoing',
    status: 'read',
    timestamp: new Date('2025-01-15T09:35:00Z'),
    phoneNumberId: '629305560276479',
    displayPhoneNumber: '918329446654'
  }
];

// Helper functions
function getConversations() {
  const conversations = {};
  
  demoMessages.forEach(msg => {
    if (!conversations[msg.waId]) {
      conversations[msg.waId] = {
        waId: msg.waId,
        userName: msg.userName,
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date(0),
        unreadCount: 0
      };
    }
    
    conversations[msg.waId].messages.push(msg);
    
    if (new Date(msg.timestamp) > conversations[msg.waId].lastMessageTime) {
      conversations[msg.waId].lastMessage = msg.messageBody;
      conversations[msg.waId].lastMessageTime = new Date(msg.timestamp);
    }
    
    if (msg.direction === 'incoming' && msg.status !== 'read') {
      conversations[msg.waId].unreadCount++;
    }
  });
  
  return Object.values(conversations).map(conv => ({
    waId: conv.waId,
    userName: conv.userName,
    lastMessage: conv.lastMessage,
    lastMessageTime: conv.lastMessageTime,
    messageCount: conv.messages.length,
    unreadCount: conv.unreadCount
  })).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
}

// API Routes

// Get all conversations (grouped by wa_id)
app.get('/api/conversations', (req, res) => {
  try {
    const conversations = getConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
app.get('/api/conversations/:waId/messages', (req, res) => {
  try {
    const { waId } = req.params;
    const messages = demoMessages
      .filter(msg => msg.waId === waId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(msg => ({
        messageId: msg.messageId,
        messageBody: msg.messageBody,
        messageType: msg.messageType,
        direction: msg.direction,
        status: msg.status,
        timestamp: msg.timestamp,
        userName: msg.userName
      }));

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation info
app.get('/api/conversations/:waId/info', (req, res) => {
  try {
    const { waId } = req.params;
    const conversation = demoMessages.find(msg => msg.waId === waId);

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

// Send a new message (demo - saves to memory only)
app.post('/api/conversations/:waId/messages', (req, res) => {
  try {
    const { waId } = req.params;
    const { messageBody } = req.body;

    if (!messageBody || messageBody.trim() === '') {
      return res.status(400).json({ error: 'Message body is required' });
    }

    // Get user info from existing conversation
    const existingMessage = demoMessages.find(msg => msg.waId === waId);
    if (!existingMessage) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create new outgoing message
    const newMessage = {
      _id: `demo_${Date.now()}`,
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
    };

    demoMessages.push(newMessage);

    // Emit real-time update
    emitMessageUpdate(waId, {
      messageId: newMessage.messageId,
      messageBody: newMessage.messageBody,
      messageType: newMessage.messageType,
      direction: newMessage.direction,
      status: newMessage.status,
      timestamp: newMessage.timestamp,
      userName: newMessage.userName
    });
    
    emitConversationUpdate();

    res.status(201).json({
      success: true,
      message: {
        messageId: newMessage.messageId,
        messageBody: newMessage.messageBody,
        direction: newMessage.direction,
        status: newMessage.status,
        timestamp: newMessage.timestamp
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
app.put('/api/conversations/:waId/mark-read', (req, res) => {
  try {
    const { waId } = req.params;
    
    demoMessages.forEach(msg => {
      if (msg.waId === waId && msg.direction === 'incoming' && msg.status !== 'read') {
        msg.status = 'read';
        msg.statusUpdatedAt = new Date();
      }
    });

    // Emit real-time update for read status
    emitMessageUpdate(waId, null, 'messages-read');
    emitConversationUpdate();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mode: 'DEMO',
    timestamp: new Date().toISOString(),
    message: 'Running in demo mode with sample data'
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// Start server
server.listen(PORT, () => {
  console.log('🚀 WhatsApp Web Clone - DEMO MODE');
  console.log('================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log('🎭 Using sample data (no database)');
  console.log('⚡ Real-time messaging enabled');
  console.log('📝 Changes will not persist');
  console.log('================================');
});