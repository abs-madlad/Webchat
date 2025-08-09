# WebChat

A modern, responsive chat interface built with Node.js, Express, MongoDB, and Socket.IO for real-time messaging.

![Image Alt](https://github.com/abs-madlad/Webchat/blob/59b963e92ce659853cff1617c83777222b2cc973/image.png)
 ![Image Alt](https://github.com/abs-madlad/Webchat/blob/614915a60b37ac17412b795f85b07f0e7c7d33a8/image.png)

## Features

- 📱 Modern chat interface
- 💬 Real-time chat conversations
- 📊 Message status indicators (sent, delivered, read)
- 🔍 Search conversations
- 📝 Send new messages (demo mode - saves to database only)
- 📱 Mobile-friendly responsive design
- 🌙 Dark theme interface
- ⚡ **Real-time messaging with Socket.IO**
- 🔔 **Live message updates without refresh**

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The app will connect to `mongodb://localhost:27017/whatsapp`

#### Option B: MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Update the `.env` file with your MongoDB Atlas connection string

### 3. Environment Configuration

Update the `.env` file with your MongoDB connection string:

```env
# For MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/whatsapp?retryWrites=true&w=majority

# For local MongoDB
# MONGODB_URI=mongodb://localhost:27017/whatsapp

PORT=3000
NODE_ENV=development
DB_NAME=whatsapp
COLLECTION_NAME=processed_messages
```

### 4. Process Sample Data

Run the script to process the sample webhook JSON files and insert them into MongoDB:

```bash
npm run process-data
```

This will:
- Read all JSON files in the current directory
- Process message and status payloads
- Insert messages into the `processed_messages` collection
- Update message statuses based on status payloads

### 5. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

- `GET /api/conversations` - Get all conversations grouped by user
- `GET /api/conversations/:waId/messages` - Get messages for a specific conversation
- `GET /api/conversations/:waId/info` - Get conversation info
- `POST /api/conversations/:waId/messages` - Send a new message
- `PUT /api/conversations/:waId/mark-read` - Mark messages as read
- `GET /api/health` - Health check endpoint

## Database Schema

The application uses a single collection `processed_messages` with the following schema:

```javascript
{
  messageId: String,        // Unique message identifier
  metaMsgId: String,        // Meta message ID for status updates
  waId: String,             // User ID (phone number)
  userName: String,         // User's display name
  messageType: String,      // 'text', 'image', 'document', etc.
  messageBody: String,      // Message content
  direction: String,        // 'incoming' or 'outgoing'
  status: String,           // 'sent', 'delivered', 'read', 'failed'
  timestamp: Date,          // Message timestamp
  statusUpdatedAt: Date,    // Last status update time
  phoneNumberId: String,    // Business phone number ID
  displayPhoneNumber: String, // Display phone number
  conversationId: String,   // Conversation ID
  originalPayload: Object   // Original webhook payload
}
```

## Sample Webhook Data

The project includes sample JSON files that simulate webhook data:

- `conversation_1_message_1.json` - Incoming message from Ravi Kumar
- `conversation_1_message_2.json` - Another message
- `conversation_1_status_1.json` - Message status update
- `conversation_1_status_2.json` - Another status update
- `conversation_2_message_1.json` - Message from Neha Joshi
- `conversation_2_message_2.json` - Another message
- `conversation_2_status_1.json` - Status update
- `conversation_2_status_2.json` - Another status update

## How It Works

The application consists of four main components:

1. **Frontend** (`public/`): HTML, CSS, and JavaScript for the user interface with Socket.IO client
2. **Backend** (`server.js`): Express.js server with API endpoints and Socket.IO for real-time communication
3. **Database** (`models/`): MongoDB with Mongoose for data persistence
4. **Real-time Engine**: Socket.IO for instant message updates and status changes

1. **Data Processing**: The `processWebhookData.js` script reads JSON webhook payloads and processes them:
   - Message payloads are inserted as new messages
   - Status payloads update existing message statuses

2. **Backend API**: Express.js server provides REST APIs for:
   - Fetching conversations and messages
   - Sending new messages
   - Updating message statuses

3. **Frontend Interface**: Vanilla JavaScript creates a modern chat interface:
   - Responsive design that works on desktop and mobile
   - Real-time message display
   - Status indicators
   - Search functionality

## Real-time Features

The application now includes real-time messaging capabilities:

### ⚡ Live Updates
- **New messages** appear instantly without page refresh
- **Message status changes** (delivered, read) update in real-time
- **Conversation list** updates automatically when new messages arrive
- **Typing indicators** and **online status** (ready for future implementation)

### 🔌 Socket.IO Integration
- Automatic connection management
- Room-based messaging for efficient updates
- Reconnection handling for network interruptions
- Browser notifications for new messages (when permission granted)

### 🧪 Testing Real-time Features

1. **Open multiple browser tabs** to `http://localhost:3000`
2. **Send messages** from one tab and see them appear instantly in others
3. **Use the test script** to simulate incoming messages:
   ```bash
   node test-realtime.js
   ```
4. **Check browser console** for real-time event logs

## Development

### Project Structure
```
whatsapp/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   └── Message.js           # Message schema
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Modern chat styling
│   └── script.js           # Frontend JavaScript
├── scripts/
│   └── processWebhookData.js # Data processing script
├── server.js               # Express server
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

### Adding New Features

1. **New Message Types**: Update the Message schema and add handling in the frontend
2. **Real-time Updates**: Consider adding WebSocket support for real-time message updates
3. **File Attachments**: Extend the schema and add file upload handling
4. **User Authentication**: Add user authentication and authorization

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Check your MongoDB connection string in `.env`
   - Ensure MongoDB service is running (for local setup)
   - Verify network access for MongoDB Atlas

2. **No Conversations Showing**:
   - Run `npm run process-data` to process sample data
   - Check MongoDB connection and data insertion

3. **Messages Not Sending**:
   - Check browser console for errors
   - Verify API endpoints are working
   - Check server logs

### Logs

Server logs will show:
- MongoDB connection status
- API request processing
- Error messages

## License

MIT License - feel free to use this project for learning and development purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server and browser console logs
3. Ensure all dependencies are properly installed
4. Verify MongoDB connection and data
