# Using n8n Chat Card in Home Assistant

## Installation

1. **Add the Custom Card Resource**
   
   In your Home Assistant dashboard, go to Settings → Dashboards → Your Dashboard → Edit Dashboard → Manage Resources
   
   Add a new resource:
   - **URL**: `/local/n8n-chat-card.js` (or your hosted URL)
   - **Resource Type**: JavaScript Module

2. **Upload the Files**
   
   Copy both files to your Home Assistant `www` directory:
   - `n8n-chat-component.js`
   - `n8n-chat-card.js`
   
   Files should be placed in: `/config/www/`

## Usage

Add the card to your dashboard using YAML configuration:

```yaml
type: custom:n8n-chat-card
webhook_url: 'https://your-n8n-instance.com/webhook/your-webhook-id'
initial_messages:
  - 'Hello! How can I assist you today?'
  - 'Feel free to ask anything.'
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `webhook_url` | string | Yes | The n8n webhook URL to send messages to |
| `initial_messages` | array | No | List of messages to display when the chat loads |

## Example Dashboard Configuration

```yaml
views:
  - title: Home
    cards:
      - type: custom:n8n-chat-card
        webhook_url: 'https://n8n.example.com/webhook/ed12105b-3e46-4a2d-8807-f2c7d04883e1'
        initial_messages:
          - 'Welcome to your smart home assistant!'
          - 'I can help you control devices and answer questions.'
```

## Troubleshooting

### Card Not Loading
- Verify both JavaScript files are in `/config/www/`
- Check that the resource is added as type "JavaScript Module"
- Look for errors in browser developer console

### Messages Not Sending
- Verify the webhook URL is correct and accessible
- Check n8n webhook is configured to return JSON with a `reply` field
- Check browser network tab for failed requests

### Styling Issues
- The card inherits Home Assistant's theme
- Card height is set to 6 grid units by default
- Component uses responsive design within the card

## Expected n8n Webhook Response

Your n8n webhook should return JSON in this format:

```json
{
  "reply": "Your response message here"
}
```