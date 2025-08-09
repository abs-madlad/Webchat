const io = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:3000');

console.log('🔌 Connecting to WhatsApp Web Clone server...');

socket.on('connect', () => {
  console.log('✅ Connected to server!');
  console.log('🎯 Socket ID:', socket.id);
  
  // Simulate joining a conversation
  socket.emit('join-conversation', '1234567890');
  
  // Simulate sending a message after 3 seconds
  setTimeout(() => {
    console.log('📤 Simulating incoming message...');
    
    // This would normally be triggered by the server when a new message arrives
    socket.emit('new-message', {
      waId: '1234567890',
      message: {
        messageId: 'test_' + Date.now(),
        messageBody: 'This is a real-time test message! 🚀',
        messageType: 'text',
        direction: 'incoming',
        status: 'delivered',
        timestamp: new Date(),
        userName: 'Test User'
      }
    });
  }, 3000);
  
  // Listen for real-time events
  socket.on('new-message', (data) => {
    console.log('📨 Received new message event:', data);
  });
  
  socket.on('conversations-updated', (data) => {
    console.log('📋 Conversations updated event:', data);
  });
  
  socket.on('messages-read', (data) => {
    console.log('👁️ Messages read event:', data);
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

// Keep the script running for 10 seconds
setTimeout(() => {
  console.log('🏁 Test completed. Disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);

console.log('⏱️ Test will run for 10 seconds...');
console.log('🌐 Open http://localhost:3000 in your browser to see real-time updates!');