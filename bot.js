const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require("openai");
const { MongoClient } = require('mongodb');
require("dotenv").config();

// MongoDB Setup
const uri = process.env.MONGO_URI;
const clientMongo = new MongoClient(uri);
let db;

// Function to connect to MongoDB
async function connectToMongo() {
    await clientMongo.connect();
    db = clientMongo.db('discordBotDb');
    console.log('Connected to MongoDB');
}

// OpenAI API client setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Discord client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    await connectToMongo();
    console.log('Bot is ready!');
    console.log(`Logged in as ${client.user.tag}!`);
});

// Function to retrieve OpenAI Thread ID using MongoDB
const getOpenAiThreadId = async (discordThreadId) => {
    try {
        const mapping = await db.collection('threadMappings').findOne({ discordThreadId: discordThreadId });
        return mapping ? mapping.openAiThreadId : null;
    } catch (error) {
        console.error('Failed to fetch OpenAI Thread ID:', error);
        return null;
    }
};

// Function to add or update a mapping in MongoDB
const addThreadToMap = async (discordThreadId, openAiThreadId) => {
    try {
        await db.collection('threadMappings').updateOne(
            { discordThreadId: discordThreadId },
            { $set: { openAiThreadId: openAiThreadId }},
            { upsert: true }
        );
        console.log(`Thread mapping updated for ${discordThreadId}`);
    } catch (error) {
        console.error('Failed to update thread map:', error);
    }
};

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const statusCheckLoop = async (openAiThreadId, runId) => {
    const run = await openai.beta.threads.runs.retrieve(openAiThreadId, runId);
    if (!["cancelled", "failed", "completed", "expired"].includes(run.status)) {
        await sleep(1000);
        return statusCheckLoop(openAiThreadId, runId);
    }
    return run.status;
};

const addMessage = (threadId, content) => {
    return openai.beta.threads.messages.create(
        threadId,
        { role: "user", content }
    );
};

// This event will run every time a message is received
client.on('messageCreate', async message => {
    if (message.mentions.has(client.user.id)) {
        console.log('Received message in thread');

        if (message.author.bot || !message.content || message.content === '') return;

        const discordThreadId = message.channel.id;
        console.log(`Received message in thread ${discordThreadId}`);

        const mentionedUser = message.mentions.users.first();
        if (!mentionedUser || mentionedUser.id !== client.user.id) return;

        let openAiThreadId = await getOpenAiThreadId(discordThreadId);
        console.log(`OpenAI thread ID: ${openAiThreadId}`);

        if (!openAiThreadId) {
            const thread = await openai.beta.threads.create();
            openAiThreadId = thread.id;
            await addThreadToMap(discordThreadId, openAiThreadId);
            console.log(`Created new OpenAI thread ${openAiThreadId}`);
        }

        if (message.channel.isThread() && message.channel.archived) {
            await message.channel.setArchived(false);
            console.log(`Unarchived thread ${discordThreadId}`);
        }

        let messagesLoaded = false;
        if(!openAiThreadId){
            const thread = await openai.beta.threads.create();
            openAiThreadId = thread.id;
            await addThreadToMap(discordThreadId, openAiThreadId);
            if(message.channel.isThread()){
                const starterMsg = await message.channel.fetchStarterMessage();
                const otherMessagesRaw = await message.channel.messages.fetch();

                const otherMessages = Array.from(otherMessagesRaw.values())
                    .map(msg => msg.content)
                    .reverse(); //oldest first

                const messages = [starterMsg.content, ...otherMessages]
                    .filter(msg => !!msg && msg !== '')

                await Promise.all(messages.map(msg => addMessage(openAiThreadId, msg)));
                messagesLoaded = true;
            }
        }

        if(!messagesLoaded){ //If this is for a thread, assume msg was loaded via .fetch() earlier
            await addMessage(openAiThreadId, message.content);
            console.log(`Added message to OpenAI thread ${openAiThreadId}`);
        }

        const run = await openai.beta.threads.runs.create(
            openAiThreadId,
            {
                assistant_id: process.env.ASSISTANT_ID,
                max_completion_tokens: 1000,
                tools: [{ type: 'file_search' }],
                tool_resources: {
                  file_search: {
                    vector_store_ids: [process.env.VECTOR_STORE_ID]
                  }
                },
                tool_choice: { type: 'file_search' }
            }
        );
        const status = await statusCheckLoop(openAiThreadId, run.id);

        const messages = await openai.beta.threads.messages.list(openAiThreadId);
        let response = messages.data[0].content[0].text.value;
        const annotations = messages.data[0].content[0].text.annotations;
        const citations = [];

        // Check if annotations is defined before trying to iterate over it
        let citationCounts = {};

        if (annotations) {
        // Iterate over the annotations and add footnotes
            for (let index = 0; index < annotations.length; index++) {
                const annotation = annotations[index];
                // Replace the text with a footnote
                response = response.replace(annotation.text, ` [${index}]`);

                // Gather citations based on annotation attributes
                if (annotation.file_citation) {
                    const citedFile = await openai.files.retrieve(annotation.file_citation.file_id);
                    if (citationCounts[citedFile.filename]) {
                        citationCounts[citedFile.filename]++;
                        citations.push(`[${index}] ${citedFile.filename} (${citationCounts[citedFile.filename]})`);
                    } else {
                        citationCounts[citedFile.filename] = 1;
                        citations.push(`[${index}] ${citedFile.filename}`);
                    }
                } else if (annotation.file_path) {
                    const citedFile = await openai.files.retrieve(annotation.file_path.file_id);
                    if (citationCounts[citedFile.filename]) {
                        citationCounts[citedFile.filename]++;
                        citations.push(`[${index}] Click <here> to download ${citedFile.filename} (${citationCounts[citedFile.filename]})`);
                    } else {
                        citationCounts[citedFile.filename] = 1;
                        citations.push(`[${index}] Click <here> to download ${citedFile.filename}`);
                    }
                    // Note: File download functionality not implemented above for brevity
                }
            }
        } else {
            console.error('Annotations is undefined');
        }

        response += '\n' + citations.join('\n');
        let chunks = response.match(/[\s\S]{1,1999}/g) || [];

        for (let chunk of chunks) {
            await message.reply(chunk);
            await sleep(2000);
        }
    }
});

async function cleanup() {
    console.log('Closing MongoDB connection...');
    await clientMongo.close();
    console.log('MongoDB connection closed');

    console.log('Shutting down the bot...');
    client.destroy(); // Properly logout and close all connections in Discord client
    process.exit(0); // Exit the process cleanly
}


process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

client.login(process.env.DISCORD_TOKEN);
