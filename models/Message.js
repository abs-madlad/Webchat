const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message identification
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  metaMsgId: {
    type: String,
    required: true
  },
  
  // User information
  waId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  
  // Message content
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'audio', 'video'],
    default: 'text'
  },
  messageBody: {
    type: String,
    required: true
  },
  
  // Message direction
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    default: 'incoming'
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    required: true
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  
  // WhatsApp metadata
  phoneNumberId: String,
  displayPhoneNumber: String,
  conversationId: String,
  
  // Original payload for reference
  originalPayload: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ waId: 1, timestamp: -1 });
messageSchema.index({ metaMsgId: 1 });

module.exports = mongoose.model('Message', messageSchema, 'processed_messages');