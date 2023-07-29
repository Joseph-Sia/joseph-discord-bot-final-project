const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const mongoose = require('mongoose');
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const ytdl = require('ytdl-core');
const dotenv = require('dotenv');
dotenv.config();

app.set ('view engine', 'pug')
app.use(express.static(path.join(__dirname, 'public')));

//Connect our mongoose to our project
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const prefixes = mongoose.model('prefixes', new mongoose.Schema({
    guildId: String,
    prefix: String
}));

//Create a schema & model for qr code
const qrCommands = mongoose.model('qrCommands', new mongoose.Schema({
    word: String,
    url: String,
    createAt: {type: Date, default:Date.now}
}));

client.on('ready', function() {
    console.log("Bot is ready!");
});

// To add feature for our bot
client.on('message', async message => {
    //to ignore any bot's message
    if (message.author.bot) return;

    // Get the prefix from the database
    const prefixData = await prefixes.findOne({ guildId: message.guild.id });
    const prefix = prefixData ? prefixData.prefix : '.';

    // Check if the message trigger the prefix change command
    if(message.content.startsWith(prefix + 'setprefix ')) {
        // Get the new prefix from the message content
        const newPrefix = message.content.slice(prefix.length + 10);

        // Update the prefix in the database
        const filter = { guildId: message.guild.id };
        const update = { prefix: newPrefix };
        await prefixes.findOneAndUpdate(filter, update, { upsert: true });

        // Confirm the prefix change to the user
        message.reply(`My prefix has been updated to "${newPrefix}".`);
    };

    // Check if the message triggers the ping command
    if (message.content.startsWith(prefix + 'ping')) {
        message.reply('Pong!');
    };

    // Check if the message trigger the direct message command
    if (message.content.startsWith(prefix + 'dm')) {

        // Respond to the message
        message.reply(`I'll send you a direct message!`);

        //Send a direct message to the user
        message.author.send(`Hi there! You just triggered me in the server "${message.guild.name}"`);
    };

    // Check if the message triggers the qr command
    if (message.content.startsWith(prefix + 'qr ')) {
        // Get the message to generate a QR code for
        const qrMessage = message.content.slice(prefix.length + 3);

        // Construct the URL to request the QR code from the API
        const url = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${qrMessage}`;

        // Store the qrMessage and url in your database
        // You would use your specific database command here
        qrCommands.create({ word: qrMessage, url: url });


        // Send the QR code image as a message attachment
        message.channel.send({
            files: [{
                attachment: url,
                name: 'qrcode.png'
            }]
        });
    };

    if (message.content.startsWith(prefix + 'music play')) {
        //Get the query or URL from the message content
        const query = message.content.slice(prefix.length + 11);

        //Check if the user is in a voice channel
        if (!message.member.voice.channel) {
            return message.reply('You need to be in a voice channel to use this command!')
        }

        //Join the user's voice channel
        const connection = await message.member.voice.channel.join();

        //Fetch the playist information
        const playist = await ytdl.getInfo(query);

        //Play each video in the playist
        for (const video of playist.items) {
            const url = `https://www.youtube.com/watch?v=${playist.video.id}`;

            //Play the audio stream
            const dispatcher = connection.play(ytdl(url, { filter: 'audioonly'}));

            //Handle events for the audio dispatcher
            dispatcher.on('start', () => {
                message.channel.send(`Now playing: ${playist.video.title}`);
            });

            dispatcher.on('finish', () => {
                message.channel.send('Finished playing!');
            });

            dispatcher.on('error', (error) => {
                console.error('Error playing audio:', error);
                message.channel.send('An error occured while playing the audio');
            });

            //Wait for the current video to finish before playing the next one
            await new Promise((resolve) => {
                dispatcher.on('finish', resolve);
            });
        };

        connection.disconnect(); // Disconnect from the voice channel after playing the playist
    };

});

//app.get ('/', function(req, res){res.sent("hello")});
app.get ('/', function(req, res){
    res.render("index")
});

app.get('/commands', async(req, res) => {
    //Fetch the lastest guild from the database (Prefix){
    const latestGuild = await prefixes.findOne().sort({createdAt: -1});
    //Fetch the latest guild from the database for qr command
    const latestqrCommand = await qrCommands.findOne().sort({createdAt: -1});
    //Render the templete
    res.render('command', {
        subtitle: 'Commands',
        categories: [
            {name: 'Prefix', icon: 'fa fa-gavel'},
            {name: 'Economy', icon: 'fa fa-database'},
            {name: 'General', icon: 'fa fa-star'},
            {name: 'Music', icon: 'fa fa-music'},
            {name: 'QR Code', icon: 'fa fa-qrcode'}
        ],
        commands: [
            {name: 'Prefix'}, 
            {name: 'GuildID'}              
        ],
        latestGuild: latestGuild,
        qrCommand: latestqrCommand
        //commands: Array.from(commands.values()),
        //commandsString: JSON.stringify(Array.from(commands.values()))
})});

app.listen(port, function(){console.log(`Server started at port ${port}`)});

client.login(process.env.BOT_TOKEN);