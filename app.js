'use strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url)
var Discord = require("discord.js");
import blessed from "neo-blessed";
import chalk from "chalk";

import https from 'https';
import got from 'got';
var replying = false;

var imageRendering;
var screen = blessed.screen({
    smartCSR: true
});

var input = blessed.textarea({

    bottom: 0,
    height: '15%',
    padding: {
        top: 1,
        left: 2
    },
    width: '100%',
    inputOnFocus: true,
    style: {
        fg: '#caced6',
        bg: 'grey',
        focus: {
            fg: '#f6f6f6',
            bg: 'black'
        }
    }
});



var log = blessed.list({
    label: 'Log',
    tags: false,
    draggable: false,
    top: 0,
    right: 0,
    width: "100%",
    height: '10%',
    keys: false,
    vi: false,
    mouse: false,
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'cyan'
        },
        style: {
            inverse: true
        }
    },
    style: {
        item: {
            hover: {
                bg: 'blue'
            }
        },
        selected: {
            bg: 'blue',
            bold: true
        }
    },
    search: function (callback) {
        prompt.input('Search:', '', function (err, value) {
            if (err) return;
            return callback(null, value);
        });
    }
});

class RenderGif {
    constructor(url,message) {
        this.url = url;
        this.messageId = message.id;
    }
    async getImage() {
        this.body = await got(this.url).buffer();
        imageRendering= this;
        
    }
    getBuffer() {
        return this.body;
    }
    getFileUrl() {
        
        return `./${this.messageId}`;
    }
}
class RenderItem {

    constructor(message) {
        this.message = message;
        this.messageList = [];

    }
    async createRenderText() {
        message = this.message;
        messageList = this.messageList;
        var words = message.content.split(" ");

        for (var i = 0; i < words.length; i++) {
            var word = words[i]
            try {
                if (word.startsWith("http")) {
                        var request = await got.post(word)
                        var contentType = request.headers['content-type'];
                        if (contentType.startsWith("text/html")) {
                            var regex = /<meta class="dynamic" name="twitter:image" content="(.+)>/gm;
                            let m;
                            while ((m = regex.exec(request.body)) !== null) {
                                    // This is necessary to avoid infinite loops with zero-width matches
                                    if (m.index === regex.lastIndex) {
                                        regex.lastIndex++;
                                }
                                var gif = new RenderGif(m[1].split('"')[0], message.id)
                                gif.getImage()
                                render.render()
                            }

                        }
                        if (contentType.startsWith("image/gif")) {
                            var gif = new RenderGif(word,message.id)
                            gif.getImage()
                        }

                }
                
            } catch (e) {}
        };
        
        if (message.attachments) {
            for (var _i = 0, _c = message.attachments.entries(); _i < _c.length; _i++) {
                var _d = _c[_i], key = _d[0], attachment = _d[1];
                messageList.push(chalk.cyan('Attachment:'));
                messageList.push(chalk.yellow('Name: ' + attachment.name));
                messageList.push(chalk.blue('Size: ' + attachment.size));
                messageList.push(chalk.red('URL: ' + attachment.url));
            }
        }
        if (message.embeds.length !== 0) {
            messageList.push(chalk.gray(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((message.author.bot ? chalk.red(message.author.username) : chalk.blue(message.author.username)) + chalk.cyan(' #' + message.author.discriminator + ':')) + " " + message.content + " \n");
            for (var _e = 0, _f = message.embeds; _e < _f.length; _e++) {
                var embed = _f[_e];
                if (embed.title) {
                    messageList.push(chalk.cyan(embed.title) + '\n');
                }
                if (embed.description) {
                    messageList.push(chalk.blue(embed.description));
                }
                if (embed.fields.length !== 0) {
                    for (var _g = 0, _h = embed.fields; _g < _h.length; _g++) {
                        var field = _h[_g];
                        messageList.push(chalk.yellow(field.name) + ": " + field.value);
                    }
                }
                if (embed.image) {
                    messageList.push('Image: ' + chalk.green((_a = embed.image) === null || _a === void 0 ? void 0 : _a.url));
                }
                if (embed.footer) {
                    messageList.push(chalk.gray((_b = embed.footer) === null || _b === void 0 ? void 0 : _b.text));
                }
            }
        }
        else {
            if (message.reference) {
                let repliedMessage = await message.fetchReference();
                var message = chalk.green(client.channels.cache.get(message.channel.id).name) + "  " + chalk.blue("Replying to:") + chalk.green(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((repliedMessage.author.bot ? chalk.blue(repliedMessage.author.username) : chalk.magenta(repliedMessage.author.username)) + chalk.cyan(' #' + repliedMessage.author.discriminator + ':')) + " " + repliedMessage.content + "             " + chalk.green(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((message.author.bot ? chalk.blue(message.author.username) : chalk.magenta(message.author.username)) + chalk.cyan(' #' + message.author.discriminator + ':')) + " " + message.content;
                messageList.push(message);
            } else {
                messageList.push(chalk.green(client.channels.cache.get(message.channel.id).name) + "  " + chalk.green(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((message.author.bot ? chalk.blue(message.author.username) : chalk.magenta(message.author.username)) + chalk.cyan(' #' + message.author.discriminator + ':')) + " " + message.content);

            }
        }



    }
    render() {
        while (!this.messageList) { }
        if (!this.text) {
            this.text = this.messageList.join("    ")
        }

        return this.text;
    }
}
class Render {
    constructor(screen, messageList,log,imageViewer) {
        this.screen = screen;
        this.messageList = messageList;
        this.messages = [];
        this.log = log;
        this.imageViewer = imageViewer;
    }
    updateMessages(messages) {
        this.messages = messages;
        this.messageList.scroll(10000);
    }

    async render() {
        this.messageList.clearItems();
        var messageList = this.messageList;

        this.messages.forEach(function (message) {
            var item = messageList.addItem(message.render())
            item.message = message.message;

        });
        if (imageRendering) {
            if (this.lastImage) {
                if (this.lastImage.getFileUrl() != imageRendering.getFileUrl()) {
                    this.lastImage = imageRendering;
                    this.imageViewer.clearImage();
                    this.imageViewer.setImage(this.lastImage.getBuffer());

                }

            } else {
                this.lastImage = imageRendering;

                this.imageViewer.setImage(this.lastImage.getBuffer());

            }
        }
        this.log.scroll(10000);

        screen.render();
        if (replying) {
            this.messageList.focus();
        }
            
    }
    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    stop() {
        this.rendering = false;
    }
}




var favoriteChannels = [];
var currentChannel;
var currentServer;

var selectedMessage;
var lastMessages = [];
import fs from "fs";
var prefix="/"


var serverList;


var channelList;




var messageList = blessed.list({
    align: 'left',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    width: '50%',
    height: '80%',
    top: 2,
    right: 0,
    border: 'line',
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'cyan'
        },
        style: {
            inverse: true
        }
    },
    style: {
        item: {
            hover: {
                bg: 'blue'
            }
        },
        selected: {
            bg: 'blue',
            bold: true
        }
    },
    items: [],
    search: function (callback) {
        prompt.input('Search:', '', function (err, value) {
            if (err) return;
            return callback(null, value);
        });
    }
});

var imageViewer = blessed.Image({
    width: "50%",
    height: "80%",
    type: "ansi",
    top: 2,
    left: 0,
    tags: true,
    border: "line",
    label: ' {bold}{cyan-fg}Image Viewer{/cyan-fg}{/bold} ',
    handler: function () { }

});

screen.append(log)
var render = new Render(screen, messageList, log, imageViewer);
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
setUpServerList();
setUpChannelList();
function showMessage(message) {
    if (lastMessages.length == 15) {
        lastMessages.shift();
    }
    var item = new RenderItem(message);
    item.createRenderText()
    lastMessages.push(item);
    render.updateMessages(lastMessages);

}
client.on('messageCreate',function(message) {
    if (currentChannel) {
        if (currentChannel.id == message.channel.id) {
            showMessage(message);
            render.render();
        }
    }
});
var app = function () {

    fs.readFile("./favoriteChannels.json", "utf8", (err, jsonString) => {
        if (err) {
            log.addItem("File read failed:", err);
            fs.writeFile('./favoriteChannels.json', JSON.stringify(favoriteChannels), err => {
                if (err) {
                     log.addItem('Error writing file', err)
                } else {
                     log.addItem('Successfully wrote file')
                }
            })
        } else {
            try {
                favoriteChannels = JSON.parse(jsonString);
            } catch (err) {
                 log.addItem("Error parsing JSON string:", err);
            }
        }
        log.scroll(10000);
    });

   
    messageList.on('select', async function (index) {
        selectedMessage = index.message;
        screen.append(input);
        input.focus();
        screen.render();
    })
   


    input.key('enter', function () {
        return __awaiter(this, void 0, void 0, function () {
            var message, args, cmd, rickrolls, parts, title, description, footer;
            return __generator(this, function (_a) {
                message = this.getValue();
                try {
                    if (message.startsWith(prefix)) {
                        args = message.slice(prefix.length).trim().split(' ');
                        cmd = args.shift().toLowerCase();
                        if (cmd === 'attach') {
                            currentChannel.send("", { files: args });
                        }
                        if (cmd === 'watching') {
                            client.user.setPresence({ activity: { name: args.join(' '), type: "WATCHING" }, status: 'online' });
                        }
                        if (cmd === 'listening') {
                            client.user.setPresence({ activity: { name: args.join(' '), type: "LISTENING" }, status: 'online' });
                        }
                        if (cmd === 'playing') {
                            client.user.setPresence({ activity: { name: args.join(' '), type: "PLAYING" }, status: 'online' });
                        }
                        if (cmd === 'streaming') {
                            client.user.setPresence({ activity: { name: args.join(' '), type: "STREAMING" }, status: 'online' });
                        }
                        if (cmd === 'rickroll' || cmd === 'rick') {
                            rickrolls = [
                                'https://tenor.com/view/rick-astley-rick-roll-dancing-dance-moves-gif-14097983',
                                'https://tenor.com/view/stick-bug-rick-roll-lol-gif-18118062',
                                'https://tenor.com/view/cant-trust-anybody-bird-turn-the-picture-upside-down-rick-rolled-rick-astley-gif-17818758',
                                'https://tenor.com/view/things-that-you-shouldnt-stare-at-for-too-long-the-sun-winnie-the-pooh-rickroll-rick-astley-gif-16585085',
                                'https://tenor.com/view/rickroll-rickastley-gif-18012371',
                                'https://tenor.com/view/rickroll-rick-astley-pupzyy-never-gonna-give-you-up-meme-gif-20503685',
                            ];
                            currentChannel.send(rickrolls[Math.floor(Math.random() * rickrolls.length)]);
                        }
                        if (cmd === 'embed') {
                            parts = args.join(' ').split('|');

                            let embed = {};

                            for (var part of parts) {
                                var field = part.split("=")[0];
                                var value = part.split("=")[1];

                                if (field == "footer") {
                                    embed['footer'] = { "text": value };
                                }

                                else {
                                    embed[field] = value;
                                }
                            }

                            currentChannel.send({ embed: embed });
                        }
                        if (cmd == "catgif") {
                            var catgifs = [
                                "https://tenor.com/view/kitten-gif-20287812",
                                "https://tenor.com/view/cat-cats-wake-up-cat-wake-up-wake-up-cat-gif-23378135",
                                "https://tenor.com/view/cat-catfat-fat-gif-20536846",
                                "https://tenor.com/view/blush-cats-makeup-gif-9370615",
                                "https://tenor.com/view/cat-yawn-stf-5614426",
                                "https://66.media.tumblr.com/1c78df6a8289fb58bf5625a360c1f7be/tumblr_paj8ie4mM31wvo7i8o1_640.gif",
                                "https://tenor.com/view/cat-funny-cat-pc-cat-reading-workaholics-gif-14796708",
                                "https://tenor.com/view/happy-gif-18305223",
                                "https://tenor.com/view/cat-hilarious-funny-lolcat-hungry-gif-9768957",
                                "https://tenor.com/view/reddit-cat-adorable-gif-3955326",
                                "https://tenor.com/view/catoo-cats-cute-cat-cute-animals-dancin-gif-15210455",
                                "https://tenor.com/view/cat-sleep-tired-cute-fall-gif-17673985",
                                "https://tenor.com/view/sad-sad-face-cat-sad-cat-cute-gif-18410833",
                                "https://tenor.com/view/m%C3%A8o-cat-gif-18182736",
                                "https://tenor.com/view/cat-skateboard-skateboard-cat-kitten-cranberry-gif-19259821",
                                "https://tenor.com/view/cat-catt-brush-cuddle-gif-12853117",
                                "https://tenor.com/view/uwu-cute-kiss-cat-muah-cat-muah-gif-22484088",
                                "https://tenor.com/view/cat-gif-19827448",
                                'https://tenor.com/view/jinny-jinnytty-simba-cat-widepeepohappy-gif-21692591',
                                'https://tenor.com/view/kitten-videogame-video-games-woofer-mc-wooferson-champ-gif-14178290',
                                'https://tenor.com/view/gaming-cat-gaming-kitten-cute-cat-cute-kitten-gif-19682588',
                                'https://tenor.com/view/cat-squish-cat-cat-head-rub-head-rub-discord-gif-20128447'
                            ];

                            currentChannel.send(catgifs[Math.floor(Math.random() * catgifs.length)]);
                        }
                        if (cmd == "doggif") {
                            var doggifs = [
                                'https://tenor.com/view/malamute-alaskan-gif-18394697',
                                'https://tenor.com/view/dogs-wait-for-me-puppies-animals-fur-babies-gif-20183332',
                                'https://tenor.com/view/dog-riding-in-a-car-windy-looking-around-strolling-dog-gif-14284934',
                                'https://tenor.com/view/code-brenden-brenfam-corgi-corgi-water-dog-gif-23791142',
                                'https://tenor.com/view/scratching-cat-dont-talk-to-me-get-away-back-off-let-me-kiss-you-gif-14331453',
                                'https://tenor.com/view/swing-puppies-gif-10865180',
                                'https://tenor.com/view/pembroke-welsh-corgi-confused-cute-walking-looking-gif-12939274',
                                'https://tenor.com/view/golden-retriever-pijama-blue-yawing-yawning-gif-13767222',
                                'https://tenor.com/view/flap-ears-waving-ears-cute-adorable-smiling-gif-15965618',
                                'https://tenor.com/view/puppies-silly-puppy-cute-puppy-doggys-dogs-gif-17639683',
                                'https://tenor.com/view/dog-cute-cuddle-puppy-gif-17035360',
                                'https://tenor.com/view/dog-hanging-out-hang-in-there-puppy-fur-baby-gif-18568564',
                                'https://tenor.com/view/dog-cute-happy-samoyed-puppy-gif-14818829',
                                'https://tenor.com/view/husky-tickle-dog-puppy-gif-7934638'
                            ];

                            currentChannel.send(doggifs[Math.floor(Math.random() * doggifs.length)]);

                        }
                        if (cmd == "reply") {
                            render.stop();
                            if (render.lastImage) {
                                render.lastImage.pause()
                            }
                            screen.remove(imageViewer)
                            replying = true;
                            input.clearValue();
                            screen.remove(input);
                            render.messageList.focus();
                            screen.render();
                        }
                        if (cmd == "server") {
                            setUpServerList();
                            
                            renderServers();
                        }
                        if (cmd == "channel") {
                            setUpChannelList();
                            renderChannels();
                        }
                    }
                    else {
                        if (message.trim() != "") {
                            if (!replying) {
                                currentChannel.send(message)
                            } else {
                                screen.append(imageViewer)
                                if (render.lastImage) {
                                    render.lastImage.play()
                                }
                                
                                replying = false;
                                selectedMessage.reply(message);
                            }
                        }
                        render.render();
                    }
                    try {
                        this.clearValue();
                    } catch (e) {}
                    screen.render();
                }
                catch (e) {
                    console.error(e);
                }
                finally {
                  

                }
                return [2 /*return*/];
            });
        });
    });


    // Quit
    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit(0);
    });

    
    
    renderServers();
}
function setUpChannelList() {
    channelList = blessed.list({
        label: ' {bold}{cyan-fg}Your Channels{/cyan-fg}{/bold}  ',
        tags: true,
        top: 1,
        right: 0,
        width: "100%",
        height: '90%',
        keys: true,
        vi: true,
        mouse: true,
        border: 'line',
        scrollbar: {
            ch: ' ',
            track: {
                bg: 'cyan'
            },
            style: {
                inverse: true
            }
        },
        style: {
            item: {
                hover: {
                    bg: 'blue'
                }
            },
            selected: {
                bg: 'blue',
                bold: true
            }
        },
        search: function (callback) {
            prompt.input('Search:', '', function (err, value) {
                if (err) return;
                return callback(null, value);
            });
        }
    });
    channelList.on('select', function (index) {
        currentChannel = index.channel;
        log.addItem(currentChannel.name)
        log.scroll(10000);
        renderMessages()
    })
}
function setUpServerList() {
    serverList = blessed.list({
        label: ' {bold}{cyan-fg}Your servers{/cyan-fg}{/bold}  ',
        tags: true,
        draggable: true,
        top: 1,
        right: 0,
        width: "100%",
        height: '90%',
        keys: true,
        vi: true,
        mouse: true,
        border: 'line',
        scrollbar: {
            ch: ' ',
            track: {
                bg: 'cyan'
            },
            style: {
                inverse: true
            }
        },
        style: {
            item: {
                hover: {
                    bg: 'blue'
                }
            },
            selected: {
                bg: 'blue',
                bold: true
            }
        },
        search: function (callback) {
            prompt.input('Search:', '', function (err, value) {
                if (err) return;
                return callback(null, value);
            });
        }
    });
    serverList.on('select', function (index) {
        currentServer = index.guild;
        log.addItem(currentServer.name)
        log.scroll(10000);
        renderChannels()
    })
}


function renderServers() {
    render.stop()
    serverList.clearItems()
    client.guilds.cache.forEach(function (guild, id) {
        var item = serverList.appendItem(guild.name);
        item.guild = guild;
    });

    screen.remove(channelList);
    screen.remove(messageList);
    screen.remove(input);
    screen.append(serverList);
    serverList.focus();
    screen.render();
}

function renderChannels() {
    render.stop()
    channelList.clearItems()
    currentServer.channels.cache.forEach(function (channel, id) {
        if (channel.isText()) {
            log.addItem(channel.name)
            log.scroll(10000);
            var item = channelList.appendItem(channel.name);
            item.channel = channel;
        }
    });

    screen.remove(imageViewer);
    screen.remove(serverList);
    screen.remove(messageList);
    screen.remove(input);
    screen.append(channelList);
    channelList.focus();
    screen.render();
}

function renderMessages() {
    screen.remove(channelList);
    screen.remove(serverList);
    //messageList.setLabel(chalk.blueBright(currentServer.name) + "  " + chalk.red(currentChannel.name))
    screen.append(imageViewer);
    screen.append(messageList);
    screen.append(input);
    input.focus();
    screen.render();
    render.render()
}


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};



client.once('ready', app);
client.login("TOKEN");