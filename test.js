import { createRequire } from 'module';
const require = createRequire(import.meta.url)
var Discord = require("discord.js");



var client = new Discord.Client({
    intents: new Discord.Intents([
        "GUILDS",
        "GUILD_MEMBERS",
        "GUILD_BANS",
        "GUILD_EMOJIS_AND_STICKERS",
        "GUILD_INTEGRATIONS",
        "GUILD_WEBHOOKS",
        "GUILD_INVITES",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_MESSAGE_TYPING",
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS",
        "DIRECT_MESSAGE_TYPING"
    ]), allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
});
client.once('ready', function () {
    var message="proe "
    var words = message.split(" ");
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        client.emojis.cache.forEach((emoji, id) => {
            if (emoji.name.toLowerCase() == word.toLowerCase()) {
                words[i] = emoji.toString();
            }

        });


    }
    console.log(words.join(" "))
});
client.login("OTI5OTYyNzYzMTc3MDU4Mzg2.Ydu9UA.rlikxn3ZOyDrc3qMdn_M40VK2s8");