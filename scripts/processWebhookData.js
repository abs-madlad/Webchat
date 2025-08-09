const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('../models/Message');
const connectDB = require('../config/database');

class WebhookProcessor {
  constructor() {
    this.processedFiles = [];
  }

  async init() {
    await connectDB();
    console.log('Webhook processor initialized');
  }

  // Process message payload
  async processMessage(payload) {
    try {
      const entry = payload.metaData.entry[0];
      const change = entry.changes[0];
      const value = change.value;

      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const contact = value.contacts[0];

        const messageData = {
          messageId: message.id,
          metaMsgId: message.id,
          waId: message.from,
          userName: contact.profile.name,
          messageType: message.type,
          messageBody: message.text ? message.text.body : '',
          direction: 'incoming',
          status: 'sent',
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          phoneNumberId: value.metadata.phone_number_id,
          displayPhoneNumber: value.metadata.display_phone_number,
          originalPayload: payload
        };

        // Check if message already exists
        const existingMessage = await Message.findOne({ messageId: message.id });
        if (!existingMessage) {
          const newMessage = new Message(messageData);
          await newMessage.save();
          console.log(`✅ Processed message from ${contact.profile.name}: ${message.text?.body}`);
        } else {
          console.log(`⚠️  Message already exists: ${message.id}`);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  // Process status payload
  async processStatus(payload) {
    try {
      const entry = payload.metaData.entry[0];
      const change = entry.changes[0];
      const value = change.value;

      if (value.statuses && value.statuses.length > 0) {
        const status = value.statuses[0];
        
        // Update message status using either id or meta_msg_id
        const updateResult = await Message.findOneAndUpdate(
          {
            $or: [
              { messageId: status.id },
              { metaMsgId: status.meta_msg_id },
              { messageId: status.meta_msg_id }
            ]
          },
          {
            status: status.status,
            statusUpdatedAt: new Date(parseInt(status.timestamp) * 1000)
          },
          { new: true }
        );

        if (updateResult) {
          console.log(`✅ Updated message status to '${status.status}' for message: ${status.id}`);
        } else {
          console.log(`⚠️  No message found to update status for: ${status.id}`);
        }
      }
    } catch (error) {
      console.error('Error processing status:', error);
    }
  }

  // Read and process all JSON files
  async processAllFiles() {
    const currentDir = process.cwd();
    const files = fs.readdirSync(currentDir).filter(file => file.endsWith('.json'));

    console.log(`Found ${files.length} JSON files to process`);

    for (const file of files) {
      try {
        const filePath = path.join(currentDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const payload = JSON.parse(fileContent);

        console.log(`\n📄 Processing file: ${file}`);

        // Determine if it's a message or status payload
        const entry = payload.metaData.entry[0];
        const change = entry.changes[0];
        const value = change.value;

        if (value.messages) {
          await this.processMessage(payload);
        } else if (value.statuses) {
          await this.processStatus(payload);
        }

        this.processedFiles.push(file);
      } catch (error) {
        console.error(`❌ Error processing file ${file}:`, error.message);
      }
    }

    console.log(`\n🎉 Processing complete! Processed ${this.processedFiles.length} files.`);
  }

  async showSummary() {
    try {
      const totalMessages = await Message.countDocuments();
      const conversations = await Message.distinct('waId');
      const statusCounts = await Message.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      console.log('\n📊 Database Summary:');
      console.log(`Total Messages: ${totalMessages}`);
      console.log(`Total Conversations: ${conversations.length}`);
      console.log('Status Distribution:');
      statusCounts.forEach(status => {
        console.log(`  ${status._id}: ${status.count}`);
      });
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  }
}

// Run the processor
async function main() {
  const processor = new WebhookProcessor();
  
  try {
    await processor.init();
    await processor.processAllFiles();
    await processor.showSummary();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

if (require.main === module) {
  main();
}

module.exports = WebhookProcessor;