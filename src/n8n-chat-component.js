/**
 * n8n Chat Component
 * 
 * CSS is embedded directly in the component rather than imported from external files
 * to avoid MIME type issues when serving files with lite-server or similar development servers.
 * Shadow DOM @import statements can fail due to CORS/MIME type restrictions.
 */

class ChatComponent extends HTMLElement {
    static get observedAttributes() {
        return ['chat-webhook-url', 'history-webhook-url', 'session-id', 'initial-messages'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.messages = [];
        this._initialMessages = [];
        this.isRendered = false;
        this.waitingOnReply = false;
        this.sessionId = this.getAttribute('session-id') || this.generateUUID();

        // Initialize from attributes if present
        this.chatWebhookUrl = this.getAttribute('chat-webhook-url') || '';
        this.historyWebhookUrl = this.getAttribute('history-webhook-url') || '';
        const initialMessagesAttr = this.getAttribute('initial-messages');
        if (initialMessagesAttr) {
            try {
                this.initialMessages = JSON.parse(initialMessagesAttr);
            } catch (e) {
                console.warn('Failed to parse initial-messages attribute as JSON:', e);
            }
        }

        this.render();

        // Fetch message history if history webhook is provided
        if (this.historyWebhookUrl) {
            this.fetchMessageHistory();
        }
    }

    // UUID generation method
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Markdown parsing method
    parseMarkdown(text) {
        if (!text) return '';
        
        // Escape HTML to prevent XSS
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        // Parse markdown syntax
        html = html
            // Code blocks (triple backticks)
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold text (**text** or __text__)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            // Italic text (*text* or _text_)
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/_([^_]+)_/g, '<em>$1</em>')
            // Links [text](url)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Headers (# ## ###)
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Lists (- item)
            .replace(/^- (.*)$/gm, '<li>$1</li>')
            // Wrap consecutive list items in <ul>
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            // Line breaks (double newlines become paragraphs)
            .replace(/\n\n+/g, '</p><p>')
            // Single newlines become <br>
            .replace(/\n/g, '<br>');

        // Wrap in paragraph if it doesn't start with a block element
        if (!html.match(/^<(h[1-6]|ul|pre|p)/)) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    // Property setters and getters
    get initialMessages() {
        return this._initialMessages;
    }

    set initialMessages(value) {
        this._initialMessages = Array.isArray(value) ? value : [];
        // If the component is already rendered, insert the messages

        this.insertInitialMessages();

    }

    // Handle attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'chat-webhook-url') {
            this.chatWebhookUrl = newValue;
        } else if (name === 'history-webhook-url') {
            this.historyWebhookUrl = newValue;
            // Fetch message history if history webhook is provided and component is rendered
            if (this.historyWebhookUrl && this.isRendered) {
                this.fetchMessageHistory();
            }
        } else if (name === 'session-id') {
            this.sessionId = newValue || this.generateUUID();
            // Fetch message history if history webhook is provided and component is rendered
            if (this.historyWebhookUrl && this.isRendered) {
                this.fetchMessageHistory();
            }
        } else if (name === 'initial-messages' && newValue) {
            try {
                this.initialMessages = JSON.parse(newValue);
            } catch (e) {
                console.warn('Failed to parse initial-messages attribute:', e);
            }
        }
    }

    insertInitialMessages() {
        if (this.isRendered) {
            // Clear existing messages first (in case this is called multiple times)
            const messagesContainer = this.shadowRoot.querySelector('.chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                this.messages = [];

                this._initialMessages.forEach(message => {
                    this.insertMessage(message, 'n8n');
                });
            }
        }
    }

    insertMessage(message, source) {
        this.messages.push({ message, source });
        this.addMessageToDom(message, source);
    }

    async sendMessage(message) {
        if (!this.chatWebhookUrl || this.waitingOnReply) {
            if (!this.chatWebhookUrl) console.error('Chat webhook URL is not set.');
            return;
        }
        try {
            this.setWaitingOnReply(true);
            this.insertMessage(message, 'user');
            await this.sendMessageToWebhook(message);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            this.setWaitingOnReply(false);
        }
    }

    async sendMessageToWebhook(message) {
        const response = await fetch(this.chatWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                sessionId: this.sessionId
            })
        });
        if (!response.ok) {
            throw new Error('Failed to send message to webhook');
        }
        const data = await response.json();
        this.insertMessage(data.reply, 'n8n');
    }

    async fetchMessageHistory() {
        try {
            const response = await fetch(this.historyWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch message history');
            }
            const data = await response.json();
            if (data.messageHistory) {
                // Parse the JSON string within messageHistory
                let historyMessages;
                try {
                    historyMessages = JSON.parse(data.messageHistory);
                } catch (e) {
                    console.error('Failed to parse messageHistory JSON:', e);
                    return;
                }

                if (Array.isArray(historyMessages)) {
                    // Clear existing messages and add history
                    this.messages = [];
                    const messagesContainer = this.shadowRoot.querySelector('.chat-messages');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = '';
                    }

                    // Insert initial messages first
                    if (this._initialMessages && this._initialMessages.length > 0) {
                        this._initialMessages.forEach(message => {
                            this.insertMessage(message, 'n8n');
                        });
                    }

                    // Then add each message from history
                    historyMessages.forEach(historyMessage => {
                        // Insert human message first (if exists)
                        if (historyMessage.human) {
                            this.insertMessage(historyMessage.human, 'user');
                        }
                        // Then insert ai message (if exists)
                        if (historyMessage.ai) {
                            this.insertMessage(historyMessage.ai, 'n8n');
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching message history:', error);
        }
    }

    setWaitingOnReply(loading) {
        this.waitingOnReply = loading;
        const button = this.shadowRoot.querySelector('.send-button');

        button.disabled = loading;
        button.textContent = loading ? 'Sending...' : 'Send';
    }

    addMessageToDom(message, sender) {
        if (this.isRendered) {
            const messageElement = document.createElement('div');
            messageElement.className = sender === 'user' ? 'user-message' : 'n8n-message';
            messageElement.innerHTML = this.parseMarkdown(message);
            this.shadowRoot.querySelector('.chat-messages').appendChild(messageElement);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .chat-container {
                    display: flex;
                    flex-direction: column; 
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                    height: 100%;
                }

                .chat-messages {
                    flex: 1;
                    padding: 10px;
                    overflow-y: auto;
                    background-color: #f0f0f0;
                    display: flex;
                    flex-direction: column;
                }

                .user-message, .n8n-message {
                    margin: 5px 0;
                    padding: 10px 12px;
                    border-radius: 18px;
                    max-width: 70%;
                    word-wrap: break-word;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .user-message {
                    background-color: #007bff;
                    color: white;
                    align-self: flex-start;
                    border-bottom-left-radius: 4px;
                }

                .n8n-message {
                    background-color: #28a745;
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 4px;
                }

                .chat-input-container {
                    display: flex;
                    padding: 10px;
                    background-color: #fff;
                    border-top: 1px solid #ccc;
                    gap: 10px;
                }

                .chat-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }

                .send-button {
                    padding: 10px 15px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .send-button:hover:not(:disabled) {
                    background-color: #0056b3;
                }

                .send-button:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }

                /* Markdown styles */
                .user-message p, .n8n-message p {
                    margin: 0 0 8px 0;
                }

                .user-message p:last-child, .n8n-message p:last-child {
                    margin-bottom: 0;
                }

                .user-message strong, .n8n-message strong {
                    font-weight: bold;
                }

                .user-message em, .n8n-message em {
                    font-style: italic;
                }

                .user-message code, .n8n-message code {
                    background-color: rgba(255, 255, 255, 0.2);
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }

                .user-message pre, .n8n-message pre {
                    background-color: rgba(255, 255, 255, 0.1);
                    padding: 8px;
                    border-radius: 6px;
                    margin: 8px 0;
                    overflow-x: auto;
                }

                .user-message pre code, .n8n-message pre code {
                    background-color: transparent;
                    padding: 0;
                    font-size: 12px;
                    line-height: 1.4;
                }

                .user-message a, .n8n-message a {
                    color: inherit;
                    text-decoration: underline;
                }

                .user-message a:hover, .n8n-message a:hover {
                    text-decoration: none;
                }

                .user-message h1, .n8n-message h1,
                .user-message h2, .n8n-message h2,
                .user-message h3, .n8n-message h3 {
                    margin: 8px 0 4px 0;
                    font-weight: bold;
                }

                .user-message h1, .n8n-message h1 {
                    font-size: 16px;
                }

                .user-message h2, .n8n-message h2 {
                    font-size: 15px;
                }

                .user-message h3, .n8n-message h3 {
                    font-size: 14px;
                }

                .user-message ul, .n8n-message ul {
                    margin: 8px 0;
                    padding-left: 20px;
                }

                .user-message li, .n8n-message li {
                    margin: 2px 0;
                }

            </style>
            <div class="chat-container">
                <div class="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" placeholder="Type a message..." />
                    <button class="send-button">Send</button>
                </div>
            </div>
        `;
        const input = this.shadowRoot.querySelector('.chat-input');
        const sendButton = this.shadowRoot.querySelector('.send-button');

        const sendMessage = () => {
            const message = input.value.trim();
            if (message && !this.waitingOnReply) {
                this.sendMessage(message);
                input.value = '';
            }
        };

        sendButton.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Mark as rendered and insert initial messages if they exist
        this.isRendered = true;
        if (this._initialMessages.length > 0) {
            this.insertInitialMessages();
        }
    }
}

customElements.define('n8n-chat-component', ChatComponent);