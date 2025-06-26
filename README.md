# n8n Chat Component

This project provides a zero-dependency web component chat interface that communicates with n8n using webhooks. The chat component is built as a web component with session management and message history capabilities, allowing for easy integration into any web application and also comes with a convenient Home Assistant card.

## Features

- **Webhook Based Chat with n8n**: Easy integration with n8n using a Webhook trigger
- **Session Management**: Configurable session IDs with UUID fallback for conversation continuity
- **Message History**: Configurable webhook for fetching and display of conversation history
- **Initial Messages**: Predefined welcome messages that appear before history
- **Markdown Support**: Zero-dependency markdown parsing for rich text formatting in messages
- **Home Assistant Integration**: Custom card wrapper for seamless Home Assistant integration

## Usage

### Including the Component

You can include the chat component in your HTML as follows:

```html
<script type="module" src="./src/n8n-chat-component.js"></script>
```


### Basic Example

Here is an example of how to use the `n8n-chat-component` in your HTML:

```html
<n8n-chat-component 
    chat-webhook-url="https://your-n8n-instance.com/chat-webhook" 
    initial-messages='["Hello!", "How can I assist you today?"]'>
</n8n-chat-component>
```

### Advanced Example with Session Management and History

```html
<n8n-chat-component 
    chat-webhook-url="https://your-n8n-instance.com/chat-webhook"
    history-webhook-url="https://your-n8n-instance.com/history-webhook"
    session-id="f47ac10b-58cc-4372-a567-0e02b2c3d479"
    initial-messages='["Welcome back!", "Your previous conversation is loaded below."]'>
</n8n-chat-component>
```

### Attributes

- `chat-webhook-url` (required): The URL of your n8n webhook where chat messages will be sent
- `history-webhook-url` (optional): The URL of your n8n webhook for fetching message history
- `session-id` (optional): Unique identifier for the chat session. If not provided, a UUID will be generated
- `initial-messages` (optional): A JSON string array of messages to display before history messages

## Webhook API

### Chat Webhook

The chat webhook receives user messages and should return AI responses.

**Request Format:**
```json
{
  "message": "User's message text",
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response Format:**
```json
{
  "reply": "AI response message"
}
```

### History Webhook

The history webhook fetches previous conversation messages for a session. This can be done by using a Chat Memory Manager node and enabling `Simplify Output` and `Group Messages`.

**Request Format:**
```json
{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response Format:**
This is the format produced by the Chat Memory Manager node when `Simply Output` and `Group Messages` are both enabled.
```json
{
  "messageHistory": "[{\"human\":\"User message\",\"ai\":\"AI response\"},{\"ai\":\"AI-only message\"}]"
}
```

Note: The `messageHistory` field contains a JSON string that should be parsed. Each message object can contain:
- `human`: User message (maps to "user" source in the messages array)
- `ai`: AI message (maps to "n8n" source in the messages array)
- Both fields are optional, allowing for messages from only one participant

## Markdown Support

The chat component includes built-in markdown parsing that automatically formats messages with rich text elements. The following markdown syntax is supported:

### Supported Markdown Features

- **Bold text**: `**bold text**` or `__bold text__`
- **Italic text**: `*italic text*` or `_italic text_`
- **Inline code**: `` `code` ``
- **Code blocks**: 
  ```
  ```
  code block
  ```
  ```
- **Links**: `[link text](https://example.com)`
- **Headers**: `# Header 1`, `## Header 2`, `### Header 3`
- **Lists**: `- list item`
- **Line breaks**: Double newlines create paragraphs, single newlines create `<br>` tags

### Example Markdown Message

```markdown
Here's a **bold** statement and some *italic* text.

You can include `inline code` or code blocks:

```
function hello() {
    console.log("Hello world!");
}
```

Visit [this link](https://n8n.io) for more information.

### Features:
- Feature 1
- Feature 2
- Feature 3
```

### Security

All user input is automatically sanitized to prevent XSS attacks while preserving markdown formatting. HTML tags are escaped before markdown parsing, ensuring safe rendering of user-generated content.

## Example workflow

An example n8n workflow is included in examples/n8n_example_workflow.json.

## Running locally

You can run the example locally. Clone the project then run the following commands:

```bash
npm install
npm run start  # Starts lite-server for development
```

Then access the example at http://localhost:3000/examples/index.html

## File Structure

```
src/
├── n8n-chat-component.js    # Main chat component
├── n8n-chat-card.js         # Home Assistant card wrapper
examples/
├── index.html               # Basic usage example
```

## Session Management

Sessions enable conversation continuity across page reloads or component re-instantiations:

1. **New Session**: Component generates a UUID automatically
2. **Resume Session**: Provide existing `session-id` to continue previous conversation
3. **Dynamic Switching**: Change `session-id` attribute to switch between conversations

## Using n8n Chat Card in Home Assistant

The n8n-chat-card component is a Home Assistant card that wraps the n8n-chat-component. To use it add a Manual card and specify this yaml:

```yaml
type: custom:n8n-chat-card
chat_webhook_url: "https://your-n8n-instance.com/chat-webhook"
initial_messages:
  - "Welcome to your Home Assistant chat!"
  - "How can I help you today?"
```

If you want to use dynamic values, for example to set a session id or an initial message you can use the [Config Template Card](https://github.com/iantrich/config-template-card/) from HACS and reference a helper such as an input_text.

```yaml
type: custom:config-template-card
entities:
  - input_text.agent_message
card:
  type: custom:n8n-chat-card
  chat_webhook_url: https://your-n8n-instance.com/chat-webhook
  initial_messages:
    - ${states['input_text.agent_message'].state}
```

### Installation

1. **Upload the Files**
   
   Copy both files to your Home Assistant `www` directory:
   - `n8n-chat-component.js`
   - `n8n-chat-card.js`
   
   Files should be placed in: `/config/www/`, create this directory if it doesn't exist.

2. **Add the Custom Card Resource**
   
   In your Home Assistant dashboard, go to Settings → Dashboards → Your Dashboard → Edit Dashboard → Manage Resources
   
   Add a new resource:
   - **URL**: `/local/n8n-chat-card.js` (or your hosted URL)
   - **Resource Type**: JavaScript Module



## License

This project is licensed under the MIT License.