class WebChat {
    constructor() {
        this.currentChat = null;
        this.conversations = [];
        this.messages = [];
        this.socket = null;
        this.init();
    }

    init() {
        this.initSocket();
        this.bindEvents();
        this.loadConversations();
        // Auto-refresh removed - using real-time Socket.IO updates instead
    }

    initSocket() {

        this.socket = io();
        

        this.socket.on('connect', () => {
            console.log('🔌 Connected to server');

            if (this.conversations.length > 0) {
                const waIds = this.conversations.map(conv => conv.waId);
                this.socket.emit('join-conversations', waIds);
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from server');
        });
        

        this.socket.on('new-message', (data) => {
            console.log('📨 New message received:', data);
            this.handleNewMessage(data);
        });
        

        this.socket.on('conversations-updated', () => {
            console.log('📋 Conversations updated');
            this.loadConversations();
        });
        

        this.socket.on('messages-read', (data) => {
            console.log('👁️ Messages marked as read:', data);
            if (this.currentChatWaId === data.waId) {
                this.loadMessages(data.waId);
            }
        });
     }

     handleNewMessage(data) {
 
         if (this.currentChatWaId === data.waId) {
             this.loadMessages(data.waId);
         }
         
 
         this.loadConversations();
         
 
         if (data.message && data.message.direction === 'incoming' && this.currentChatWaId !== data.waId) {
             this.showNotification(`New message from ${data.message.userName || data.waId}`);
         }
     }

     showNotification(message) {
 
         console.log('🔔 Notification:', message);
         
 
         if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('WebChat', {
                 body: message,
                 icon: '/favicon.ico'
             });
         }
     }

     bindEvents() {

        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });


        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });


    }

    async loadConversations() {
        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) throw new Error('Failed to load conversations');
            
            this.conversations = await response.json();
            this.renderConversations();
            

            if (this.socket && this.socket.connected) {
                const waIds = this.conversations.map(conv => conv.waId);
                this.socket.emit('join-conversations', waIds);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Failed to load conversations');
        }
    }

    renderConversations() {
        const chatList = document.getElementById('chatList');
        
        if (this.conversations.length === 0) {
            chatList.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-comments"></i>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        chatList.innerHTML = this.conversations.map(conv => `
            <div class="chat-item" data-wa-id="${conv.waId}" onclick="app.selectChat('${conv.waId}')">
                <div class="chat-avatar">
                    ${this.getInitials(conv.userName)}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${this.escapeHtml(conv.userName)}</div>
                    <div class="chat-last-message">${this.escapeHtml(conv.lastMessage)}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${this.formatTime(conv.lastMessageTime)}</div>
                    ${conv.unreadCount > 0 ? `<div class="unread-count">${conv.unreadCount}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    filterConversations(searchTerm) {
        const filteredConversations = this.conversations.filter(conv => 
            conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.waId.includes(searchTerm)
        );
        
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = filteredConversations.map(conv => `
            <div class="chat-item" data-wa-id="${conv.waId}" onclick="app.selectChat('${conv.waId}')">
                <div class="chat-avatar">
                    ${this.getInitials(conv.userName)}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${this.escapeHtml(conv.userName)}</div>
                    <div class="chat-last-message">${this.escapeHtml(conv.lastMessage)}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${this.formatTime(conv.lastMessageTime)}</div>
                    ${conv.unreadCount > 0 ? `<div class="unread-count">${conv.unreadCount}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    async selectChat(waId) {
        try {

            if (this.currentChatWaId && this.socket) {
                this.socket.emit('leave-conversation', this.currentChatWaId);
            }
            

            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-wa-id="${waId}"]`).classList.add('active');


            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('chatInterface').style.display = 'flex';

            this.currentChatWaId = waId;
            

            if (this.socket) {
                this.socket.emit('join-conversation', waId);
            }
            

            await Promise.all([
                this.loadChatInfo(waId),
                this.loadMessages(waId, true),
                this.markAsRead(waId)
            ]);
        } catch (error) {
            console.error('Error selecting chat:', error);
            this.showError('Failed to load chat');
        }
    }

    async loadChatInfo(waId) {
        try {
            const response = await fetch(`/api/conversations/${waId}/info`);
            if (!response.ok) throw new Error('Failed to load chat info');
            
            const info = await response.json();
            document.getElementById('contactName').textContent = info.userName;
            document.getElementById('contactStatus').textContent = `+${info.phoneNumber}`;
        } catch (error) {
            console.error('Error loading chat info:', error);
        }
    }

    async loadMessages(waId, showLoading = true) {
        try {
            if (showLoading) {
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="messages-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                `;
            }

            const response = await fetch(`/api/conversations/${waId}/messages`);
            if (!response.ok) throw new Error('Failed to load messages');
            
            const messages = await response.json();
            this.messages = messages;
            this.renderMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('Failed to load messages');
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        
        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="messages-loading">
                    <i class="fas fa-comment"></i>
                    <p>No messages yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(msg => `
            <div class="message ${msg.direction}">
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(msg.messageBody)}</div>
                    <div class="message-meta">
                        <span class="message-time">${this.formatMessageTime(msg.timestamp)}</span>
                        ${msg.direction === 'outgoing' ? `
                            <span class="message-status">
                                <i class="fas ${this.getStatusIcon(msg.status)} status-icon status-${msg.status}"></i>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const messageText = messageInput.value.trim();
        
        if (!messageText || !this.currentChat) return;

        
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;
        messageInput.disabled = true;

        try {
            const response = await fetch(`/api/conversations/${this.currentChat}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageBody: messageText })
            });

            if (!response.ok) throw new Error('Failed to send message');
            

            messageInput.value = '';
            

            await this.loadMessages(this.currentChat, false);
            

            await this.loadConversations();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
        } finally {

            sendBtn.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
        }
    }

    async markAsRead(waId) {
        try {
            await fetch(`/api/conversations/${waId}/mark-read`, {
                method: 'PUT'
            });
            

            const chatItem = document.querySelector(`[data-wa-id="${waId}"]`);
            const unreadBadge = chatItem.querySelector('.unread-count');
            if (unreadBadge) {
                unreadBadge.remove();
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }


    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    }

    getStatusIcon(status) {
        switch (status) {
            case 'sent':
                return 'fa-check';
            case 'delivered':
                return 'fa-check-double';
            case 'read':
                return 'fa-check-double';
            default:
                return 'fa-clock';
        }
    }

    showError(message) {

        console.error(message);
        

        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

const app = new WebChat();
window.app = app;