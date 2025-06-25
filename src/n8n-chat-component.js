/**
 * n8n Chat Component
 * 
 * CSS is embedded directly in the component rather than imported from external files
 * to avoid MIME type issues when serving files with lite-server or similar development servers.
 * Shadow DOM @import statements can fail due to CORS/MIME type restrictions.
 */

class ChatComponent extends HTMLElement {
    static get observedAttributes() {
        return ['webhook-url', 'initial-messages'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.messages = [];
        this._initialMessages = [];
        this.isRendered = false;
        this.waitingOnReply = false;

        // Initialize from attributes if present
        this.webhookUrl = this.getAttribute('webhook-url') || '';
        const initialMessagesAttr = this.getAttribute('initial-messages');
        if (initialMessagesAttr) {
            try {
                this.initialMessages = JSON.parse(initialMessagesAttr);
            } catch (e) {
                console.warn('Failed to parse initial-messages attribute as JSON:', e);
            }
        }

        this.render();
    }

    // Property setters and getters
    get initialMessages() {
        return this._initialMessages;
    }

    set initialMessages(value) {
        this._initialMessages = Array.isArray(value) ? value : [];
        // If the component is already rendered, insert the messages
        if (this.isRendered) {
            this.insertInitialMessages();
        }
    }

    // Handle attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'webhook-url') {
            this.webhookUrl = newValue;
        } else if (name === 'initial-messages' && newValue) {
            try {
                this.initialMessages = JSON.parse(newValue);
            } catch (e) {
                console.warn('Failed to parse initial-messages attribute:', e);
            }
        }
    }

    insertInitialMessages() {
        // Clear existing messages first (in case this is called multiple times)
        const messagesContainer = this.shadowRoot.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            this.messages = [];

            this._initialMessages.forEach(message => {
                this.messages.push({ source: 'n8n', message });
                this.addMessageToDom(message, 'n8n');
            });
        }
    }

    async sendMessage(message) {
        if (!this.webhookUrl || this.waitingOnReply) {
            if (!this.webhookUrl) console.error('Webhook URL is not set.');
            return;
        }
        try {
            this.setWaitingOnReply(true);
            this.messages.push({ source: 'user', message });
            this.addMessageToDom(message, 'user');
            await this.sendMessageToWebhook(message);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            this.setWaitingOnReply(false);
        }
    }

    async sendMessageToWebhook(message) {
        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        if (!response.ok) {
            throw new Error('Failed to send message to webhook');
        }
        const data = await response.json();
        this.messages.push({ source: 'n8n', message: data.reply });
        this.addMessageToDom(data.reply, 'n8n');
    }

    setWaitingOnReply(loading) {
        this.waitingOnReply = loading;
        const button = this.shadowRoot.querySelector('.send-button');

        button.disabled = loading;
        button.textContent = loading ? 'Sending...' : 'Send';
    }

    addMessageToDom(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = sender === 'user' ? 'user-message' : 'n8n-message';
        messageElement.textContent = message;
        this.shadowRoot.querySelector('.chat-messages').appendChild(messageElement);
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