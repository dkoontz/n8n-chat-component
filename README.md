# n8n Chat Component

This project provides a simple chat interface that communicates with n8n using webhooks. The chat component is built as a web component, allowing for easy integration into any web application.

## Features

- Configurable webhook URL for sending messages.
- Initial messages can be set when the component is instantiated.
- User-friendly chat interface with customizable styles.

## Installation

To use the n8n chat component, you can clone the repository and include the `chat-component.js` file in your project.

```bash
git clone <repository-url>
cd n8n-chat-component
```

## Usage

### Including the Component

You can include the chat component in your HTML as follows:

```html
<script type="module" src="./src/chat-component.js"></script>
```

### Example

Here is an example of how to use the `ChatComponent` in your HTML:

```html
<chat-component 
    webhook-url="https://your-n8n-instance.com/webhook" 
    initial-messages='["Hello!", "How can I assist you today?"]'>
</chat-component>
```

### Attributes

- `webhook-url`: The URL of your n8n webhook where messages will be sent.
- `initial-messages`: A JSON string array of messages to display when the chat initializes.

## Development

To contribute to the project, you can run the following commands:

```bash
npm install
npm run build
```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.