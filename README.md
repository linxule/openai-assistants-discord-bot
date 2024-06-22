# Example Usage

Test case where the bot is equipped with a collection of management research papers to enable interactive literture disucssion on a Discord Server.
![Screenshot20240501 102709@2x](https://github.com/linxule/openai-assistants-discord-bot/assets/43122877/decf90f7-99de-46ce-ba09-1d76b4f0d748)

# Example Prompt for OpenAI Assistant

Imagine you are an expert facilitator of literature discussions, with deep knowledge of management and organizational studies. Your role is to engage participants in thoughtful, nuanced conversations that deepen their understanding and appreciation of the texts.

When a discussion topic and relevant literature are provided, you will:
Carefully review the supplied literature, identifying key themes, concepts, and questions that can spark meaningful dialogue.

Craft an opening message that sets an inviting and thought-provoking tone for the discussion. Share your initial insights and pose open-ended questions to encourage participation.

As the discussion unfolds, draw connections between participants' comments and the literature. Highlight interesting parallels, contrasts, or implications to enrich the conversation.

Ask follow-up questions that prompt participants to elaborate on their ideas, consider alternative perspectives, and relate the literature to real-world contexts or personal experiences.

Provide concise summaries of key points to crystallize important insights and keep the discussion focused. Gently redirect if the conversation veers off-topic.

Encourage balanced participation, inviting quieter voices to share their thoughts. Acknowledge and build upon valuable contributions.
Conclude the discussion by reflecting on key takeaways and provocative questions raised. Thank participants for their engagement and ideas.

Throughout, maintain a warm and intellectually curious tone that motivates participants to explore the literature deeply. Aim for discussions that leave participants with new insights, appreciation for diverse viewpoints, and excitement to engage further with the texts and ideas.


See below for installation and use guide from the original repo at https://github.com/VoloBuilds/openai-assistants-discord-bot.
-----

# NodeJS Discord Bot Using the new OpenAI Assistants API

In this repo we integrate Discord.js with the new OpenAI Assistants API. The bot operates within Discord channels, listening to messages and using OpenAI to generate responses.

## Video Guide
View the full tutorial and explanation of concepts here:
https://youtu.be/5TU_wOC0dmw

## Features

- **Discord Integration**: The bot listens to messages in Discord channels.
- **OpenAI Response Generation**: Leverages the new OpenAI Assistants API to create responses to messages.
- **Message Thread Tracking**: Maintains message threads for continuity in conversations.
- **NEW Assistants Capabilities**: Since the bot uses Assistants, you no longer have to worry about context management and you can also benefit from assistant capabilities such as `code interpreter` and knowledge `retrieval`

## Prerequisites

- Node.js installed on your machine.
- A Discord bot token (from Discord Developer Portal).
- An OpenAI API key.

## Installation

1. **Clone the Repository**:
   ```
   git clone [repository-url]
   ```
2. **Navigate to the Repository Folder**:
   ```
   cd openai-assistants-discord-bot
   ```
3. **Install Dependencies**:
   ```
   npm install
   ```

## Configuration

1. **Set Up Environment Variables**:
   Create a `.env` file in the root of your project with the following variables:
   mv .env.sample .env 
   ```
   DISCORD_TOKEN=your_discord_bot_token
   OPENAI_API_KEY=your_openai_api_key
   ASSISTANT_ID=your_openai_assistant_id
   ```

## Running the Bot

1. **Start the Bot**:
   ```
   node bot.js
   ```
   OR
   ```
   nodemon bot.js
   ```

## Usage

- **Interaction**: Simply type and send messages in your Discord server where the bot is added. The bot will automatically generate and send replies based on the OpenAI model's output.
- **Discord Channels**: Works in any text channel or thread where the bot has permissions to read and send messages.

## Contributing

Feel free to fork the repository and submit pull requests.

## License

MIT
