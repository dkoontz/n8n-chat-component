/**
 * Home Assistant Custom Card for n8n Chat Component
 * 
 * This card wraps the existing n8n-chat-component to make it compatible
 * with Home Assistant's custom card interface.
 */


// Import the existing ChatComponent
import './n8n-chat-component.js';

class N8nChatCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Required method for Home Assistant custom cards
     * Validates and stores the card configuration
     */
    setConfig(config) {
        if (!config.webhook_url) {
            throw new Error('webhook_url is required');
        }

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

        // Set attributes from card config
        chatComponent.setAttribute('webhook-url', this.config.webhook_url);

        if (this.config.initial_messages) {
            chatComponent.setAttribute('initial-messages', JSON.stringify(this.config.initial_messages));
        }

        // Add the chat component to the shadow DOM
        this.shadowRoot.appendChild(chatComponent);

        // Fallback: Set properties directly as well (in case attributes don't work)
        setTimeout(() => {
            chatComponent.webhookUrl = this.config.webhook_url;
            if (this.config.initial_messages) {
                chatComponent.initialMessages = this.config.initial_messages;
            }
        }, 0);
    }
}

// Register the custom card
customElements.define('n8n-chat-card', N8nChatCard);

// Provide card information for Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'n8n-chat-card',
    name: 'n8n Chat Card',
    description: 'A chat interface that connects to n8n webhooks'
});
