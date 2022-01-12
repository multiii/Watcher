import { createRequire } from 'module';
const require = createRequire(import.meta.url)
var Discord = require("discord.js");

var fs = require("fs");
import blessed from "neo-blessed";
import chalk from "chalk";
import https from 'https';
import got from 'got';
import terminalImage from 'terminal-image';
var gif = false;
var _a, _b;
var replying = false;

var globalList;

var angles = {
    '\u2518': true, // '┘'
    '\u2510': true, // '┐'
    '\u250c': true, // '┌'
    '\u2514': true, // '└'
    '\u253c': true, // '┼'
    '\u251c': true, // '├'
    '\u2524': true, // '┤'
    '\u2534': true, // '┴'
    '\u252c': true, // '┬'
    '\u2502': true, // '│'
    '\u2500': true  // '─'
};

var langles = {
    '\u250c': true, // '┌'
    '\u2514': true, // '└'
    '\u253c': true, // '┼'
    '\u251c': true, // '├'
    '\u2534': true, // '┴'
    '\u252c': true, // '┬'
    '\u2500': true  // '─'
};

var uangles = {
    '\u2510': true, // '┐'
    '\u250c': true, // '┌'
    '\u253c': true, // '┼'
    '\u251c': true, // '├'
    '\u2524': true, // '┤'
    '\u252c': true, // '┬'
    '\u2502': true  // '│'
};

var rangles = {
    '\u2518': true, // '┘'
    '\u2510': true, // '┐'
    '\u253c': true, // '┼'
    '\u2524': true, // '┤'
    '\u2534': true, // '┴'
    '\u252c': true, // '┬'
    '\u2500': true  // '─'
};

var dangles = {
    '\u2518': true, // '┘'
    '\u2514': true, // '└'
    '\u253c': true, // '┼'
    '\u251c': true, // '├'
    '\u2524': true, // '┤'
    '\u2534': true, // '┴'
    '\u2502': true  // '│'
};

// var cdangles = {
//   '\u250c': true  // '┌'
// };

// Every ACS angle character can be
// represented by 4 bits ordered like this:
// [langle][uangle][rangle][dangle]
var angleTable = {
    '0000': '', // ?
    '0001': '\u2502', // '│' // ?
    '0010': '\u2500', // '─' // ??
    '0011': '\u250c', // '┌'
    '0100': '\u2502', // '│' // ?
    '0101': '\u2502', // '│'
    '0110': '\u2514', // '└'
    '0111': '\u251c', // '├'
    '1000': '\u2500', // '─' // ??
    '1001': '\u2510', // '┐'
    '1010': '\u2500', // '─' // ??
    '1011': '\u252c', // '┬'
    '1100': '\u2518', // '┘'
    '1101': '\u2524', // '┤'
    '1110': '\u2534', // '┴'
    '1111': '\u253c'  // '┼'
};

var screen = blessed.screen({
    smartCSR:true,
    fullUnicode:true,
    debug: true,
   useBCE:false
});

screen.draw = function (start, end) {
    // this.emit('predraw');

    var x
        , y
        , line
        , out
        , ch
        , data
        , attr
        , fg
        , bg
        , flags;

    var main = ''
        , pre
        , post;

    var clr
        , neq
        , xx;

    var lx = -1
        , ly = -1
        , o;

    var acs;

    if (screen._buf) {
        main += screen._buf;
        screen._buf = '';
    }

    for (y = start; y <= end; y++) {
        line = screen.lines[y];
        o = screen.olines[y];

        if (!line.dirty && !(screen.cursor.artificial && y === screen.program.y)) {
            continue;
        }
        line.dirty = false;

        out = '';
        attr = screen.dattr;

        for (x = 0; x < line.length; x++) {
            data = line[x][0];
            ch = line[x][1];

            // Render the artificial cursor.
            if (screen.cursor.artificial
                && !screen.cursor._hidden
                && screen.cursor._state
                && x === screen.program.x
                && y === screen.program.y) {
                var cattr = screen._cursorAttr(screen.cursor, data);
                if (cattr.ch) ch = cattr.ch;
                data = cattr.attr;
            }

            // Take advantage of xterm's back_color_erase feature by using a
            // lookahead. Stop spitting out so many damn spaces. NOTE: Is checking
            // the bg for non BCE terminals worth the overhead?
            if (screen.options.useBCE
                && ch === ' '
                && (screen.tput.bools.back_color_erase
                || (data & 0x1ff) === (screen.dattr & 0x1ff))
                && ((data >> 18) & 8) === ((screen.dattr >> 18) & 8)) {
                clr = true;
                neq = false;

                for (xx = x; xx < line.length; xx++) {
                    if (line[xx][0] !== data || line[xx][1] !== ' ') {
                        clr = false;
                        break;
                    }
                    if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
                        neq = true;
                    }
                }

                if (clr && neq) {
                    lx = -1, ly = -1;
                    if (data !== attr) {
                        out += screen.codeAttr(data);
                        attr = data;
                    }
                    out += screen.tput.cup(y, x);
                    out += screen.tput.el();
                    for (xx = x; xx < line.length; xx++) {
                        o[xx][0] = data;
                        o[xx][1] = ' ';
                    }
                    break;
                }

                // If there's more than 10 spaces, use EL regardless
                // and start over drawing the rest of line. Might
                // not be worth it. Try to use ECH if the terminal
                // supports it. Maybe only try to use ECH here.
                // //if (this.tput.strings.erase_chars)
                // if (!clr && neq && (xx - x) > 10) {
                //   lx = -1, ly = -1;
                //   if (data !== attr) {
                //     out += this.codeAttr(data);
                //     attr = data;
                //   }
                //   out += this.tput.cup(y, x);
                //   if (this.tput.strings.erase_chars) {
                //     // Use erase_chars to avoid erasing the whole line.
                //     out += this.tput.ech(xx - x);
                //   } else {
                //     out += this.tput.el();
                //   }
                //   if (this.tput.strings.parm_right_cursor) {
                //     out += this.tput.cuf(xx - x);
                //   } else {
                //     out += this.tput.cup(y, xx);
                //   }
                //   this.fillRegion(data, ' ',
                //     x, this.tput.strings.erase_chars ? xx : line.length,
                //     y, y + 1);
                //   x = xx - 1;
                //   continue;
                // }

                // Skip to the next line if the
                // rest of the line is already drawn.
                // if (!neq) {
                //   for (; xx < line.length; xx++) {
                //     if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
                //       neq = true;
                //       break;
                //     }
                //   }
                //   if (!neq) {
                //     attr = data;
                //     break;
                //   }
                // }
            }

            // Optimize by comparing the real output
            // buffer to the pending output buffer.

            o[x][0] = data;
            o[x][1] = ch;

            if (data !== attr) {
                if (attr !== screen.dattr) {
                    out += '\x1b[m';
                }
                if (data !== screen.dattr) {
                    out += '\x1b[';

                    bg = data & 0x1ff;
                    fg = (data >> 9) & 0x1ff;
                    flags = data >> 18;

                    // bold
                    if (flags & 1) {
                        out += '1;';
                    }

                    // underline
                    if (flags & 2) {
                        out += '4;';
                    }

                    // blink
                    if (flags & 4) {
                        out += '5;';
                    }

                    // inverse
                    if (flags & 8) {
                        out += '7;';
                    }

                    // invisible
                    if (flags & 16) {
                        out += '8;';
                    }

                    if (bg !== 0x1ff) {
                        bg = screen._reduceColor(bg);
                        if (bg < 16) {
                            if (bg < 8) {
                                bg += 40;
                            } else if (bg < 16) {
                                bg -= 8;
                                bg += 100;
                            }
                            out += bg + ';';
                        } else {
                            out += '48;5;' + bg + ';';
                        }
                    }

                    if (fg !== 0x1ff) {
                        fg = screen._reduceColor(fg);
                        if (fg < 16) {
                            if (fg < 8) {
                                fg += 30;
                            } else if (fg < 16) {
                                fg -= 8;
                                fg += 90;
                            }
                            out += fg + ';';
                        } else {
                            out += '38;5;' + fg + ';';
                        }
                    }

                    if (out[out.length - 1] === ';') out = out.slice(0, -1);

                    out += 'm';
                }
            }

            // If we find a double-width char, eat the next character which should be
            // a space due to parseContent's behavior.
            if (screen.fullUnicode) {
                // If this is a surrogate pair double-width char, we can ignore it
                // because parseContent already counted it as length=2.
                if (charWidth(line[x][1]) === 2) {
                    // NOTE: At cols=44, the bug that is avoided
                    // by the angles check occurs in widget-unicode:
                    // Might also need: `line[x + 1][0] !== line[x][0]`
                    // for borderless boxes?
                    if (x === line.length - 1 || angles[line[x + 1][1]]) {
                        // If we're at the end, we don't have enough space for a
                        // double-width. Overwrite it with a space and ignore.
                        ch = ' ';
                        o[x][1] = '\0';
                    } else {
                        // ALWAYS refresh double-width chars because this special cursor
                        // behavior is needed. There may be a more efficient way of doing
                        // this. See above.
                        o[x][1] = '\0';
                        // Eat the next character by moving forward and marking as a
                        // space (which it is).
                        o[++x][1] = '\0';
                    }
                }
            }

            // Attempt to use ACS for supported characters.
            // This is not ideal, but it's how ncurses works.
            // There are a lot of terminals that support ACS
            // *and UTF8, but do not declare U8. So ACS ends
            // up being used (slower than utf8). Terminals
            // that do not support ACS and do not explicitly
            // support UTF8 get their unicode characters
            // replaced with really ugly ascii characters.
            // It is possible there is a terminal out there
            // somewhere that does not support ACS, but
            // supports UTF8, but I imagine it's unlikely.
            // Maybe remove !this.tput.unicode check, however,
            // this seems to be the way ncurses does it.
            if (screen.tput.strings.enter_alt_charset_mode
                && !screen.tput.brokenACS && (screen.tput.acscr[ch] || acs)) {
                // Fun fact: even if this.tput.brokenACS wasn't checked here,
                // the linux console would still work fine because the acs
                // table would fail the check of: this.tput.acscr[ch]
                if (screen.tput.acscr[ch]) {
                    if (acs) {
                        ch = screen.tput.acscr[ch];
                    } else {
                        ch = screen.tput.smacs()
                            + screen.tput.acscr[ch];
                        acs = true;
                    }
                } else if (acs) {
                    ch = screen.tput.rmacs() + ch;
                    acs = false;
                }
            } else {
                // U8 is not consistently correct. Some terminfo's
                // terminals that do not declare it may actually
                // support utf8 (e.g. urxvt), but if the terminal
                // does not declare support for ACS (and U8), chances
                // are it does not support UTF8. This is probably
                // the "safest" way to do this. Should fix things
                // like sun-color.
                // NOTE: It could be the case that the $LANG
                // is all that matters in some cases:
                // if (!this.tput.unicode && ch > '~') {
                if (!screen.tput.unicode && screen.tput.numbers.U8 !== 1 && ch > '~') {
                    ch = screen.tput.utoa[ch] || '?';
                }
            }

            out += ch;
            attr = data;
        }

        if (attr !== screen.dattr) {
            out += '\x1b[m';
        }

        if (out) {
            main += screen.tput.cup(y, 0) + out;
        }
    }

    if (acs) {
        main += screen.tput.rmacs();
        acs = false;
    }

    if (main) {
        pre = '';
        post = '';

        pre += screen.tput.sc();
        post += screen.tput.rc();

        if (!screen.program.cursorHidden) {
            pre += screen.tput.civis();
            post += screen.tput.cnorm();
        }

        // this.program.flush();
        // this.program._owrite(pre + main + post);
        screen.program._write(pre + main + post);
    }

    // this.emit('draw');
};
var input = blessed.textarea({

    bottom: 0,
    height: '15%',
    padding: {
        top: 1,
        left: 2
    },
    fg: '#caced6',
    bg: 'grey',
    focus: {
        fg: '#f6f6f6',
        bg: 'black'
    },
    border:"line",
    width: '100%',
    inputOnFocus: true
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



var favoriteChannels = [];
var currentChannel;
var currentServer;

var selectedMessage;

var prefix = "/"


var serverList;


var channelList;

var lastImage;


var messageList = blessed.list({
    align: 'left',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    width: '100%',
    height: '80%',
    top: 2,
    right: 0,
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
        fg: '#caced6',
        bg: 'grey',
        focus: {
            fg: '#f6f6f6',
            bg: 'black'
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


function renderMessages() {
    screen.remove(channelList);
    screen.remove(serverList);
    messageList.setLabel(chalk.blueBright(currentServer.name) + "  " + chalk.red(currentChannel.name))
    screen.append(messageList);
    screen.append(input);
    input.focus();
    console.clear();
    screen.render();
}


function showGlobalList() {
    globalList = blessed.list({
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
    globalList.on('select', function (index) {
        favoriteChannels.push(index.channel.id);
        fs.writeFile('./favoriteChannels.json', JSON.stringify(favoriteChannels), err => {
            if (err) {
                log.addItem('Error writing file', err)
            } else {
                log.addItem('Successfully wrote file')
            }
        })
        currentChannel = index.channel;
        log.addItem(currentChannel.name);
        log.scroll(10000);
        screen.remove(globalList);
        renderMessages();
    })

    client.channels.cache.forEach(function (channel, id) {
        if (channel.isText()) {
            log.addItem(channel.name)
            log.scroll(10000);
            var item = channelList.appendItem(channel.name);
            item.channel = channel;
            
           
        }
    });

    screen.remove(serverList);
    screen.remove(messageList);
    screen.remove(input);
    screen.append(channelList);
    channelList.focus();
    console.clear();
    screen.render();
}


function showChannelList() {
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

    currentServer.channels.cache.forEach(function (channel, id) {
        if (channel.isText()) {
            log.addItem(channel.name)
            log.scroll(10000);
            var item = channelList.appendItem(channel.name);
            item.channel = channel;
        }
    });

    screen.remove(serverList);
    screen.remove(messageList);
    screen.remove(input);
    screen.append(channelList);
    channelList.focus();
    console.clear();
    screen.render();
}

function showServerList() {
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
        showChannelList()
    })
    client.guilds.cache.forEach(function (guild, id) {
        var item = serverList.appendItem(guild.name);
        item.guild = guild;
    });
    if (channelList) {
        screen.remove(channelList);
    }
    screen.remove(messageList);
    screen.remove(input);
    screen.append(serverList);
    serverList.focus();
    console.clear();
    screen.render();
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


var app = function () {

    fs.readFile("./favoriteChannels.json", "utf8", (err, jsonString) => {
        if (err) {
            log.addItem("File read failed:", err);
           
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
        console.clear();
        screen.render();
    })

    async function getImage(url) {


        var request = await got(url);
    
        var contentType = request.headers['content-type'];
        if (contentType.startsWith("text/html")) {
            var regex = /<meta class="dynamic" name="twitter:image" content="(.+)>/gm;
            let m;
            while ((m = regex.exec(request.body)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                var body = await got(m[1].split('"')[0]).buffer()
                lastImage = body;
                gif = true;
            }

        }
        if (contentType.startsWith("image/gif")) {
            lastImage = request.buffer();
            gif = true;
        } else if (contentType.startsWith("image")) {
            lastImage = request.rawBody;
            gif = false;
        }
    }
    client.on('messageCreate', async function (message) {
        if (currentChannel) {
            if (currentChannel.id == message.channel.id || favoriteChannels.includes(message.channel.id)) {
                if (message.attachments) {
                    let keys = Array.from(message.attachments.values());
                    keys.forEach( function (attachment) {
                        var item = messageList.addItem(chalk.cyan('Attachment:'));
                        item.message = message;
                        var item = messageList.addItem(chalk.yellow('Name: ' + attachment.name));
                        item.message = message;
                        var item = messageList.addItem(chalk.blue('Size: ' + attachment.size));
                        item.message = message;
                        var item = messageList.addItem(chalk.red('URL: ' + attachment.url));
                        item.message = message;
                        getImage(attachment.url)
                    });
                }
                if (message.embeds.length !== 0) {

                    var item = messageList.addItem(chalk.gray(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((message.author.bot ? chalk.red(message.author.username) : chalk.blue(message.author.username)) + chalk.cyan(' #' + message.author.discriminator + ':')) + " " + message.content + " \n");
                    item.message = message;
                    for (var _e = 0, _f = message.embeds; _e < _f.length; _e++) {
                        var embed = _f[_e];
                        if (embed.title) {
                            var item = messageList.addItem(chalk.cyan(embed.title) + '\n');
                            item.message = message;
                        }
                        if (embed.description) {
                            var item = messageList.addItem(chalk.blue(embed.description));
                            item.message = message;
                        }
                        if (embed.fields.length !== 0) {
                            for (var _g = 0, _h = embed.fields; _g < _h.length; _g++) {
                                var field = _h[_g];
                                var item = messageList.addItem(chalk.yellow(field.name) + ": " + field.value);
                                item.message = message;
                            }
                        }
                        if (embed.image) {
                            var item = messageList.addItem('Image: ' + chalk.green((_a = embed.image) === null || _a === void 0 ? void 0 : _a.url));
                            item.message = message;
                        }
                        if (embed.footer) {
                            var item = messageList.addItem(chalk.gray((_b = embed.footer) === null || _b === void 0 ? void 0 : _b.text));
                            item.message = message;
                        }
                    }
                }
                else {
                    var words = message.content.split(" ")
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
                                        var body = await got(m[1].split('"')[0]).buffer()
                                        lastImage = body;
                                        gif = true;
                                    }

                                }
                                if (contentType.startsWith("image/gif")) {
                                    lastImage = request.buffer()
                                    gif = true;
                                } else if (contentType.startsWith("image")) {
                                    lastImage = request.buffer()
                                    gif = false;
                                }

                            }
                        } catch (e) { }
                    };

                    if (message.reference) {
                        let repliedMessage = await message.fetchReference();
                        var message = chalk.green(client.channels.cache.get(message.channel.id).name) + "  " + chalk.blue("Replying to:") + chalk.green(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((repliedMessage.author.bot ? chalk.blue(repliedMessage.author.username) : chalk.magenta(repliedMessage.author.username)) + chalk.cyan(' #' + repliedMessage.author.discriminator + ':')) + " " + repliedMessage.content + "             " + chalk.green(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((message.author.bot ? chalk.blue(message.author.username) : chalk.magenta(message.author.username)) + chalk.cyan(' #' + message.author.discriminator + ':')) + " " + message.content;
                        var item = messageList.addItem(message);
                        item.message = message;
                    } else {
                        var item = messageList.addItem(chalk.green(client.channels.cache.get(message.channel.id).name) + "  " + chalk.green(new Date().getHours() + ':' + new Date().getMinutes()) + " " + ((message.author.bot ? chalk.blue(message.author.username) : chalk.magenta(message.author.username)) + chalk.cyan(' #' + message.author.discriminator + ':')) + " " + message.content);
                        item.message = message;
                    }
                }
                
                messageList.scrollTo(10000);
                console.clear();
                screen.render();
            }
        }
    });


    input.key('enter', function () {
        return __awaiter(this, void 0, void 0, function () {
            var message, args, cmd, rickrolls, parts, title, description, footer;
            return __generator(this,  function (_a) {
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
                            replying = true;
                            input.clearValue();
                            screen.remove(input);
                            messageList.focus();
                            console.clear();
                            screen.render();
                            messageList.select(messageList.items.length - 1)
                            console.clear();
                            screen.render();
                        }
                        if (cmd == "server") {
                            showServerList();
                        }
                        if (cmd == "channel") {
                            showChannelList();
                        }
                        if (cmd == "view") {
                            input.clearValue();
                            screen.remove(input);
                            screen.remove(messageList);
                            if (lastImage) {

                                var prompt = blessed.prompt({
                                    left: 'center',
                                    top: 'center',
                                    height: 'shrink',
                                    width: 'shrink',
                                    border: 'line',
                                });
                                screen.append(prompt);
                                console.clear();
                                screen.render();
                                if (gif) {
                                    console.log(gif)

                                    var gifRendered = terminalImage.gifBuffer(lastImage)
                                    console.log(gifRendered)
                                    prompt.input("Press Enter to go back!", "", function (name) {
                                        gifRendered();
                                        console.clear()
                                        screen.remove(prompt);
                                            renderMessages();
                                     });
                                  
                                    
                                } else {
                                    console.log(gif)
                                   
                                    terminalImage.buffer(lastImage).then(function (buffer) {
                                        console.log(buffer);
                                        prompt.input("Press Enter to go back!", "", function (name) {
                                            console.clear()
                                            screen.remove(prompt);
                                            renderMessages();
                                        });
                                    });
                                }
                            }
                        }
                    }
                    else {
                        if (message.trim() != "") {
                            if (!replying) {
                                currentChannel.send(message)
                            } else {
                                replying = false;
                                selectedMessage.reply(message);
                            }
                        }

                    }
                    try {
                        this.clearValue();
                    } catch (e) { }
                    console.clear();
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



    showServerList();
}


function charWidth(str, i) {
    var point = typeof str !== 'number'
        ? codePointAt(str, i || 0)
        : str;

    // nul
    if (point === 0) return 0;

    // tab
    if (point === 0x09) {
        
        return blessed.screen.global
            ? blessed.screen.global.tabc.length
            : 8;
    }

    // 8-bit control characters (2-width according to unicode??)
    if (point < 32 || (point >= 0x7f && point < 0xa0)) {
        return 0;
    }

    // search table of non-spacing characters
    // is ucs combining or C0/C1 control character
    if (combining[point]) {
        return 0;
    }

    // check for double-wide
    // if (point >= 0x1100
    //     && (point <= 0x115f // Hangul Jamo init. consonants
    //     || point === 0x2329 || point === 0x232a
    //     || (point >= 0x2e80 && point <= 0xa4cf
    //     && point !== 0x303f) // CJK ... Yi
    //     || (point >= 0xac00 && point <= 0xd7a3) // Hangul Syllables
    //     || (point >= 0xf900 && point <= 0xfaff) // CJK Compatibility Ideographs
    //     || (point >= 0xfe10 && point <= 0xfe19) // Vertical forms
    //     || (point >= 0xfe30 && point <= 0xfe6f) // CJK Compatibility Forms
    //     || (point >= 0xff00 && point <= 0xff60) // Fullwidth Forms
    //     || (point >= 0xffe0 && point <= 0xffe6)
    //     || (point >= 0x20000 && point <= 0x2fffd)
    //     || (point >= 0x30000 && point <= 0x3fffd))) {
    //   return 2;
    // }

    // check for double-wide
    if ((0x3000 === point)
        || (0xFF01 <= point && point <= 0xFF60)
        || (0xFFE0 <= point && point <= 0xFFE6)) {
        return 2;
    }

    if ((0x1100 <= point && point <= 0x115F)
        || (0x11A3 <= point && point <= 0x11A7)
        || (0x11FA <= point && point <= 0x11FF)
        || (0x2329 <= point && point <= 0x232A)
        || (0x2E80 <= point && point <= 0x2E99)
        || (0x2E9B <= point && point <= 0x2EF3)
        || (0x2F00 <= point && point <= 0x2FD5)
        || (0x2FF0 <= point && point <= 0x2FFB)
        || (0x3001 <= point && point <= 0x303E)
        || (0x3041 <= point && point <= 0x3096)
        || (0x3099 <= point && point <= 0x30FF)
        || (0x3105 <= point && point <= 0x312D)
        || (0x3131 <= point && point <= 0x318E)
        || (0x3190 <= point && point <= 0x31BA)
        || (0x31C0 <= point && point <= 0x31E3)
        || (0x31F0 <= point && point <= 0x321E)
        || (0x3220 <= point && point <= 0x3247)
        || (0x3250 <= point && point <= 0x32FE)
        || (0x3300 <= point && point <= 0x4DBF)
        || (0x4E00 <= point && point <= 0xA48C)
        || (0xA490 <= point && point <= 0xA4C6)
        || (0xA960 <= point && point <= 0xA97C)
        || (0xAC00 <= point && point <= 0xD7A3)
        || (0xD7B0 <= point && point <= 0xD7C6)
        || (0xD7CB <= point && point <= 0xD7FB)
        || (0xF900 <= point && point <= 0xFAFF)
        || (0xFE10 <= point && point <= 0xFE19)
        || (0xFE30 <= point && point <= 0xFE52)
        || (0xFE54 <= point && point <= 0xFE66)
        || (0xFE68 <= point && point <= 0xFE6B)
        || (0x1B000 <= point && point <= 0x1B001)
        || (0x1F200 <= point && point <= 0x1F202)
        || (0x1F210 <= point && point <= 0x1F23A)
        || (0x1F240 <= point && point <= 0x1F248)
        || (0x1F250 <= point && point <= 0x1F251)
        || (0x20000 <= point && point <= 0x2F73F)
        || (0x2B740 <= point && point <= 0x2FFFD)
        || (0x30000 <= point && point <= 0x3FFFD)) {
        return 2;
    }

    // CJK Ambiguous
    // http://www.unicode.org/reports/tr11/
    // http://www.unicode.org/reports/tr11/#Ambiguous
    if (process.env.NCURSES_CJK_WIDTH) {
        if ((0x00A1 === point)
            || (0x00A4 === point)
            || (0x00A7 <= point && point <= 0x00A8)
            || (0x00AA === point)
            || (0x00AD <= point && point <= 0x00AE)
            || (0x00B0 <= point && point <= 0x00B4)
            || (0x00B6 <= point && point <= 0x00BA)
            || (0x00BC <= point && point <= 0x00BF)
            || (0x00C6 === point)
            || (0x00D0 === point)
            || (0x00D7 <= point && point <= 0x00D8)
            || (0x00DE <= point && point <= 0x00E1)
            || (0x00E6 === point)
            || (0x00E8 <= point && point <= 0x00EA)
            || (0x00EC <= point && point <= 0x00ED)
            || (0x00F0 === point)
            || (0x00F2 <= point && point <= 0x00F3)
            || (0x00F7 <= point && point <= 0x00FA)
            || (0x00FC === point)
            || (0x00FE === point)
            || (0x0101 === point)
            || (0x0111 === point)
            || (0x0113 === point)
            || (0x011B === point)
            || (0x0126 <= point && point <= 0x0127)
            || (0x012B === point)
            || (0x0131 <= point && point <= 0x0133)
            || (0x0138 === point)
            || (0x013F <= point && point <= 0x0142)
            || (0x0144 === point)
            || (0x0148 <= point && point <= 0x014B)
            || (0x014D === point)
            || (0x0152 <= point && point <= 0x0153)
            || (0x0166 <= point && point <= 0x0167)
            || (0x016B === point)
            || (0x01CE === point)
            || (0x01D0 === point)
            || (0x01D2 === point)
            || (0x01D4 === point)
            || (0x01D6 === point)
            || (0x01D8 === point)
            || (0x01DA === point)
            || (0x01DC === point)
            || (0x0251 === point)
            || (0x0261 === point)
            || (0x02C4 === point)
            || (0x02C7 === point)
            || (0x02C9 <= point && point <= 0x02CB)
            || (0x02CD === point)
            || (0x02D0 === point)
            || (0x02D8 <= point && point <= 0x02DB)
            || (0x02DD === point)
            || (0x02DF === point)
            || (0x0300 <= point && point <= 0x036F)
            || (0x0391 <= point && point <= 0x03A1)
            || (0x03A3 <= point && point <= 0x03A9)
            || (0x03B1 <= point && point <= 0x03C1)
            || (0x03C3 <= point && point <= 0x03C9)
            || (0x0401 === point)
            || (0x0410 <= point && point <= 0x044F)
            || (0x0451 === point)
            || (0x2010 === point)
            || (0x2013 <= point && point <= 0x2016)
            || (0x2018 <= point && point <= 0x2019)
            || (0x201C <= point && point <= 0x201D)
            || (0x2020 <= point && point <= 0x2022)
            || (0x2024 <= point && point <= 0x2027)
            || (0x2030 === point)
            || (0x2032 <= point && point <= 0x2033)
            || (0x2035 === point)
            || (0x203B === point)
            || (0x203E === point)
            || (0x2074 === point)
            || (0x207F === point)
            || (0x2081 <= point && point <= 0x2084)
            || (0x20AC === point)
            || (0x2103 === point)
            || (0x2105 === point)
            || (0x2109 === point)
            || (0x2113 === point)
            || (0x2116 === point)
            || (0x2121 <= point && point <= 0x2122)
            || (0x2126 === point)
            || (0x212B === point)
            || (0x2153 <= point && point <= 0x2154)
            || (0x215B <= point && point <= 0x215E)
            || (0x2160 <= point && point <= 0x216B)
            || (0x2170 <= point && point <= 0x2179)
            || (0x2189 === point)
            || (0x2190 <= point && point <= 0x2199)
            || (0x21B8 <= point && point <= 0x21B9)
            || (0x21D2 === point)
            || (0x21D4 === point)
            || (0x21E7 === point)
            || (0x2200 === point)
            || (0x2202 <= point && point <= 0x2203)
            || (0x2207 <= point && point <= 0x2208)
            || (0x220B === point)
            || (0x220F === point)
            || (0x2211 === point)
            || (0x2215 === point)
            || (0x221A === point)
            || (0x221D <= point && point <= 0x2220)
            || (0x2223 === point)
            || (0x2225 === point)
            || (0x2227 <= point && point <= 0x222C)
            || (0x222E === point)
            || (0x2234 <= point && point <= 0x2237)
            || (0x223C <= point && point <= 0x223D)
            || (0x2248 === point)
            || (0x224C === point)
            || (0x2252 === point)
            || (0x2260 <= point && point <= 0x2261)
            || (0x2264 <= point && point <= 0x2267)
            || (0x226A <= point && point <= 0x226B)
            || (0x226E <= point && point <= 0x226F)
            || (0x2282 <= point && point <= 0x2283)
            || (0x2286 <= point && point <= 0x2287)
            || (0x2295 === point)
            || (0x2299 === point)
            || (0x22A5 === point)
            || (0x22BF === point)
            || (0x2312 === point)
            || (0x2460 <= point && point <= 0x24E9)
            || (0x24EB <= point && point <= 0x254B)
            || (0x2550 <= point && point <= 0x2573)
            || (0x2580 <= point && point <= 0x258F)
            || (0x2592 <= point && point <= 0x2595)
            || (0x25A0 <= point && point <= 0x25A1)
            || (0x25A3 <= point && point <= 0x25A9)
            || (0x25B2 <= point && point <= 0x25B3)
            || (0x25B6 <= point && point <= 0x25B7)
            || (0x25BC <= point && point <= 0x25BD)
            || (0x25C0 <= point && point <= 0x25C1)
            || (0x25C6 <= point && point <= 0x25C8)
            || (0x25CB === point)
            || (0x25CE <= point && point <= 0x25D1)
            || (0x25E2 <= point && point <= 0x25E5)
            || (0x25EF === point)
            || (0x2605 <= point && point <= 0x2606)
            || (0x2609 === point)
            || (0x260E <= point && point <= 0x260F)
            || (0x2614 <= point && point <= 0x2615)
            || (0x261C === point)
            || (0x261E === point)
            || (0x2640 === point)
            || (0x2642 === point)
            || (0x2660 <= point && point <= 0x2661)
            || (0x2663 <= point && point <= 0x2665)
            || (0x2667 <= point && point <= 0x266A)
            || (0x266C <= point && point <= 0x266D)
            || (0x266F === point)
            || (0x269E <= point && point <= 0x269F)
            || (0x26BE <= point && point <= 0x26BF)
            || (0x26C4 <= point && point <= 0x26CD)
            || (0x26CF <= point && point <= 0x26E1)
            || (0x26E3 === point)
            || (0x26E8 <= point && point <= 0x26FF)
            || (0x273D === point)
            || (0x2757 === point)
            || (0x2776 <= point && point <= 0x277F)
            || (0x2B55 <= point && point <= 0x2B59)
            || (0x3248 <= point && point <= 0x324F)
            || (0xE000 <= point && point <= 0xF8FF)
            || (0xFE00 <= point && point <= 0xFE0F)
            || (0xFFFD === point)
            || (0x1F100 <= point && point <= 0x1F10A)
            || (0x1F110 <= point && point <= 0x1F12D)
            || (0x1F130 <= point && point <= 0x1F169)
            || (0x1F170 <= point && point <= 0x1F19A)
            || (0xE0100 <= point && point <= 0xE01EF)
            || (0xF0000 <= point && point <= 0xFFFFD)
            || (0x100000 <= point && point <= 0x10FFFD)) {
            return +process.env.NCURSES_CJK_WIDTH || 1;
        }
    }

    return 1;
}
var combiningTable = [
    [0x0300, 0x036F], [0x0483, 0x0486], [0x0488, 0x0489],
    [0x0591, 0x05BD], [0x05BF, 0x05BF], [0x05C1, 0x05C2],
    [0x05C4, 0x05C5], [0x05C7, 0x05C7], [0x0600, 0x0603],
    [0x0610, 0x0615], [0x064B, 0x065E], [0x0670, 0x0670],
    [0x06D6, 0x06E4], [0x06E7, 0x06E8], [0x06EA, 0x06ED],
    [0x070F, 0x070F], [0x0711, 0x0711], [0x0730, 0x074A],
    [0x07A6, 0x07B0], [0x07EB, 0x07F3], [0x0901, 0x0902],
    [0x093C, 0x093C], [0x0941, 0x0948], [0x094D, 0x094D],
    [0x0951, 0x0954], [0x0962, 0x0963], [0x0981, 0x0981],
    [0x09BC, 0x09BC], [0x09C1, 0x09C4], [0x09CD, 0x09CD],
    [0x09E2, 0x09E3], [0x0A01, 0x0A02], [0x0A3C, 0x0A3C],
    [0x0A41, 0x0A42], [0x0A47, 0x0A48], [0x0A4B, 0x0A4D],
    [0x0A70, 0x0A71], [0x0A81, 0x0A82], [0x0ABC, 0x0ABC],
    [0x0AC1, 0x0AC5], [0x0AC7, 0x0AC8], [0x0ACD, 0x0ACD],
    [0x0AE2, 0x0AE3], [0x0B01, 0x0B01], [0x0B3C, 0x0B3C],
    [0x0B3F, 0x0B3F], [0x0B41, 0x0B43], [0x0B4D, 0x0B4D],
    [0x0B56, 0x0B56], [0x0B82, 0x0B82], [0x0BC0, 0x0BC0],
    [0x0BCD, 0x0BCD], [0x0C3E, 0x0C40], [0x0C46, 0x0C48],
    [0x0C4A, 0x0C4D], [0x0C55, 0x0C56], [0x0CBC, 0x0CBC],
    [0x0CBF, 0x0CBF], [0x0CC6, 0x0CC6], [0x0CCC, 0x0CCD],
    [0x0CE2, 0x0CE3], [0x0D41, 0x0D43], [0x0D4D, 0x0D4D],
    [0x0DCA, 0x0DCA], [0x0DD2, 0x0DD4], [0x0DD6, 0x0DD6],
    [0x0E31, 0x0E31], [0x0E34, 0x0E3A], [0x0E47, 0x0E4E],
    [0x0EB1, 0x0EB1], [0x0EB4, 0x0EB9], [0x0EBB, 0x0EBC],
    [0x0EC8, 0x0ECD], [0x0F18, 0x0F19], [0x0F35, 0x0F35],
    [0x0F37, 0x0F37], [0x0F39, 0x0F39], [0x0F71, 0x0F7E],
    [0x0F80, 0x0F84], [0x0F86, 0x0F87], [0x0F90, 0x0F97],
    [0x0F99, 0x0FBC], [0x0FC6, 0x0FC6], [0x102D, 0x1030],
    [0x1032, 0x1032], [0x1036, 0x1037], [0x1039, 0x1039],
    [0x1058, 0x1059], [0x1160, 0x11FF], [0x135F, 0x135F],
    [0x1712, 0x1714], [0x1732, 0x1734], [0x1752, 0x1753],
    [0x1772, 0x1773], [0x17B4, 0x17B5], [0x17B7, 0x17BD],
    [0x17C6, 0x17C6], [0x17C9, 0x17D3], [0x17DD, 0x17DD],
    [0x180B, 0x180D], [0x18A9, 0x18A9], [0x1920, 0x1922],
    [0x1927, 0x1928], [0x1932, 0x1932], [0x1939, 0x193B],
    [0x1A17, 0x1A18], [0x1B00, 0x1B03], [0x1B34, 0x1B34],
    [0x1B36, 0x1B3A], [0x1B3C, 0x1B3C], [0x1B42, 0x1B42],
    [0x1B6B, 0x1B73], [0x1DC0, 0x1DCA], [0x1DFE, 0x1DFF],
    [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2063],
    [0x206A, 0x206F], [0x20D0, 0x20EF], [0x302A, 0x302F],
    [0x3099, 0x309A], [0xA806, 0xA806], [0xA80B, 0xA80B],
    [0xA825, 0xA826], [0xFB1E, 0xFB1E], [0xFE00, 0xFE0F],
    [0xFE20, 0xFE23], [0xFEFF, 0xFEFF], [0xFFF9, 0xFFFB],
    [0x10A01, 0x10A03], [0x10A05, 0x10A06], [0x10A0C, 0x10A0F],
    [0x10A38, 0x10A3A], [0x10A3F, 0x10A3F], [0x1D167, 0x1D169],
    [0x1D173, 0x1D182], [0x1D185, 0x1D18B], [0x1D1AA, 0x1D1AD],
    [0x1D242, 0x1D244], [0xE0001, 0xE0001], [0xE0020, 0xE007F],
    [0xE0100, 0xE01EF]
];

var combining = combiningTable.reduce(function (out, row) {
    for (var i = row[0]; i <= row[1]; i++) {
        out[i] = true;
    }
    return out;
}, {});

 function codePointAt (str, position) {
    if (str == null) {
        throw TypeError();
    }
    var string = String(str);
    if (string.codePointAt) {
        return string.codePointAt(position);
    }
    var size = string.length;
    // `ToInteger`
    var index = position ? Number(position) : 0;
    if (index !== index) { // better `isNaN`
        index = 0;
    }
    // Account for out-of-bounds indices:
    if (index < 0 || index >= size) {
        return undefined;
    }
    // Get the first code unit
    var first = string.charCodeAt(index);
    var second;
    if ( // check if it’s the start of a surrogate pair
        first >= 0xD800 && first <= 0xDBFF && // high surrogate
        size > index + 1 // there is a next code unit
    ) {
        second = string.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        }
    }
    return first;
}
client.once('ready', app);
client.login("TOKEN");