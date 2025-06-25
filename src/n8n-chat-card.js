/**
 * Home Assistant Custom Card for n8n Chat Component
 * 
 * This card wraps the existing n8n-chat-component to make it compatible
 * with Home Assistant's custom card interface.
 */

console.log('n8n-chat-card.js file loaded');

// Import the existing ChatComponent
import './n8n-chat-component.js';
console.log('n8n-chat-component.js imported');

class N8nChatCard extends HTMLElement {
    constructor() {
        console.log('N8nChatCard constructor called');
        super();
        this.attachShadow({ mode: 'open' });
        console.log('N8nChatCard shadow DOM attached');
    }

    /**
     * Required method for Home Assistant custom cards
     * Validates and stores the card configuration
     */
    setConfig(config) {
        if (!config.webhook_url) {
            throw new Error('webhook_url is required');
        }

        console.log('N8nChatCard setConfig called with:', config);
        this.config = config;
        this.render();
    }

    /**
     * Required property setter for Home Assistant custom cards
     * Receives Home Assistant state updates (not needed for this card)
     */
    set hass(hass) {
        // We don't need Home Assistant state for the chat component
        // This is just here to satisfy the custom card interface
    }

    /**
     * Optional method that defines the card height for masonry layout
     * Returns the number of grid rows the card should occupy
     */
    getCardSize() {
        return 6; // Reasonable height for a chat interface
    }

    /**
     * Renders the card by creating and configuring an n8n-chat-component
     */
    render() {
        if (!this.config) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                }
                n8n-chat-component {
                    display: block;
                    height: 100%;
                    width: 100%;
                }
            </style>
        `;

        // Create the chat component
        const chatComponent = document.createElement('n8n-chat-component');
        console.log('Created chat component:', chatComponent);

        // Set attributes from card config
        console.log('Setting webhook-url:', this.config.webhook_url);
        chatComponent.setAttribute('webhook-url', this.config.webhook_url);

        if (this.config.initial_messages) {
            console.log('Setting initial-messages:', this.config.initial_messages);
            chatComponent.setAttribute('initial-messages', JSON.stringify(this.config.initial_messages));
        }

        // Add the chat component to the shadow DOM
        this.shadowRoot.appendChild(chatComponent);
        console.log('Chat component added to DOM');

        // Fallback: Set properties directly as well (in case attributes don't work)
        setTimeout(() => {
            console.log('Setting properties directly as fallback');
            chatComponent.webhookUrl = this.config.webhook_url;
            if (this.config.initial_messages) {
                chatComponent.initialMessages = this.config.initial_messages;
            }
        }, 0);
    }
}

// Register the custom card
console.log('Registering n8n-chat-card custom element');
customElements.define('n8n-chat-card', N8nChatCard);
console.log('n8n-chat-card custom element registered');

// Provide card information for Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'n8n-chat-card',
    name: 'n8n Chat Card',
    description: 'A chat interface that connects to n8n webhooks'
});
console.log('n8n-chat-card added to window.customCards:', window.customCards);

// Simple test to verify the card works programmatically
setTimeout(() => {
    console.log('Running programmatic test of n8n-chat-card');
    try {
        const testCard = document.createElement('n8n-chat-card');
        console.log('Test card created:', testCard);
        
        testCard.setConfig({
            webhook_url: 'https://test.example.com/webhook',
            initial_messages: ['Test message 1', 'Test message 2']
        });
        console.log('Test setConfig completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
    }
}, 1000);