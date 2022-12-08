const { EmbedBuilder } = require("discord.js");

class Command {
    constructor(prefix, callback, logger, bot) {
        this.prefix = prefix;
        this.callback = callback;
        this.logger = logger;
        this.bot = bot;
    }

    async callback(target, args) {
        await target.reply("This is a test command. Please fix.");
    }

    getHelpMessage() {
        return "This command has not been formatted yet!";
    }

    buildEmbed(args) {
        const { title, author, description, thumbnail, fields, footer } = args;
        return new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(title)
            .setAuthor(author)
            .setDescription(description)
            .setThumbnail(thumbnail)
            .addFields(fields)
            .setTimestamp()
            .setFooter(footer);
    }

    async getChannel(msg) {
        return await this.bot.channels.cache.get(msg.channelId);
    }

    checkArgEquals(arg, valids) {
        return valids.some((validType) => arg === validType);
    }
}

class CEcho extends Command {
    constructor(logger, bot) {
        async function run(target, args) {
            const removedMsg = "INVALID-CONTENT";
            if (Array.isArray(args))
                return await target.reply(
                    args.join(" ").replace(/\<.*\>/gi, removedMsg)
                );
            await target.reply(args.replace(/\<.*\>/gi, removedMsg));
        }
        super("echo", run, logger, bot);
        this.getHelpMessage = () => "Usage: $echo {text}";
    }
}

class CWhoIs extends Command {
    constructor(logger, bot, orm) {
        async function run(target, args) {
            const userNameSearch = args[0].trim();
            if (!userNameSearch || userNameSearch.length < 5) {
                await target.reply(
                    "You must supply at least 5 characters to search a username."
                );
                return;
            }
            const response = await this.orm
                .userData()
                .getUserData(userNameSearch);

            if (typeof response === "string") {
                // No users found or error
                await target.reply(response);
                return;
            }
            if (!Array.isArray(response)) return;
            response.forEach(async (user) => {
                let loggedMessages = await orm
                    .userData()
                    .getUserMessagesCount(user.user_discord_id);
                loggedMessages = isNaN(loggedMessages)
                    ? "Unknown"
                    : loggedMessages;
                const embed = this.buildEmbed({
                    title: user.user_name,
                    author: {
                        name: "USER",
                        icronURL: "https://i.imgur.com/AfFp7pu.png",
                    },
                    description: "User Information",
                    thumbnail: `http://cdn.discordapp.com/avatars/${user.user_discord_id}/${user.user_avatar}`,
                    fields: [
                        {
                            name: "Current Name",
                            value: user.user_name,
                        },
                        {
                            name: "Discord ID",
                            value: user.user_discord_id,
                        },
                        {
                            name: "User Discriminator",
                            value: `${user.user_name}#${user.user_discriminator}`,
                        },
                        {
                            name: "Current logged messages",
                            value: loggedMessages.toString(),
                        },
                    ],
                    footer: { text: user.user_is_bot ? "BOT" : "Real User" },
                });
                const channel = await this.getChannel(target);
                await channel.send({ embeds: [embed] });
            });
        }
        super("whois", run, logger, bot);
        this.orm = orm;
        this.getHelpMessage = () =>
            "Usage: $whois {username phrase (character length 5 minimum)}";
    }
}

class CFindWord extends Command {
    constructor(logger, bot, orm) {
        async function run(target, args) {
            const word = args.join(" ");
            const response = await this.orm.messageData().checkWordCount(word);
            if (typeof response === "string")
                return await target.reply(response);
            const dict = {};
            let wordCount = 0;
            const re = new RegExp(`${word}`, "gi");
            response.forEach((row) => {
                wordCount += row.message_content.match(re).length;
                if (!(row.user_discord_id in dict))
                    dict[row.user_discord_id] = 1;
                else dict[row.user_discord_id] += 1;
            });
            await target.reply(
                `\`\`\`yaml\n- Phrase: '${word}' has been spoken ${wordCount} time(s) by ${
                    Object.keys(dict).length
                } unique person(s).\n- Please use command 'my-words' for more detailed phrase information.\`\`\``
            );
        }
        super("phrase", run, logger, bot);
        this.orm = orm;
        this.getHelpMessage = () => "Usage: $phrase {word phrase}";
    }
}

class CBigWordCount extends Command {
    constructor(logger, bot, orm) {
        async function run(target, args) {
            const argType = args[0].toLowerCase();
            if (
                !this.checkArgEquals(argType, [
                    "length",
                    "amount",
                    "amount-gt",
                    "amount-lt",
                    "word",
                ])
            ) {
                return await target.reply(
                    "Invalid my-words type. Use length OR word OR [amount|amount-gt|amount-lt]"
                );
            }

            let argOption = args[1];
            if (argType !== "word") {
                const checkNum = Number(argOption);
                if (isNaN(checkNum) || !Number.isInteger(checkNum))
                    return await target.reply(
                        "Invalid my-words arg. 2nd Args must be a valid Integer"
                    );
            } else argOption = argOption.toLowerCase();

            const massiveWordDict = await this.orm
                .messageData()
                .getMassiveWordCount(target.author.id, argType, argOption);

            let reply = "```js\nYou have spoken:\n";
            for (const word in massiveWordDict)
                reply += `"${word.replace('"', '\\"').replace("'", "\\'")}"=> ${
                    massiveWordDict[word]
                } time(s),\t`;
            if (reply.length > 1700) reply = reply.slice(0, 1699);
            reply +=
                "\n-> Some results may have been omitted due to response limit. Use '$my-words {type} {arg}'```";
            await target.reply(reply);
        }
        super("my-words", run, logger, bot);
        this.orm = orm;
        this.getHelpMessage = () =>
            "Usage: $my-words {length | word | [amount | amount-gt | amount-lt]} {option argument}";
    }
}

class CHelp extends Command {
    constructor(logger, bot, orm, wrapper) {
        async function run(target, args) {
            let reply = "```yaml\nCommands:\n";
            for (const cmd in wrapper) {
                reply += `${wrapper[cmd].prefix} -> ${wrapper[
                    cmd
                ].getHelpMessage?.()}\n`;
            }
            reply += "```";
            await target.reply(reply);
        }
        super("help", run, logger, bot);
        this.orm = orm;
        this.wrapper = wrapper;
        this.getHelpMessage = () => "This Command";
    }
}

class CVersion extends Command {
    constructor(logger, bot, version) {
        async function run(target) {
            await target.reply(
                `\`\`\`js\nI am running on version ${this.version}\`\`\``
            );
        }
        super("version", run, logger, bot);
        this.getHelpMessage = () => "Check version number";
        this.version = version;
    }
}

class CFail extends Command {
    constructor(logger, bot) {
        async function run(target) {
            this.logger.warn(
                `User ${target.author.username} ran an unknown command: ${target.content}`
            );
            await target.reply(`Unknown command ${target.content}`);
        }
        super("fail", run, logger, bot);
    }
}

class CBotErrors extends Command {
    constructor(logger, bot, orm) {
        async function run(target) {
            this.logger.warn(
                `Attempting to delete bot errors. Called from user: ${target.author.username}`
            );
            await this.orm.botErrors().deleteBotErrors();
            target.reply("Check logs for detected and deleted errors");
        }
        super("fail", run, logger, bot);
        this.orm = orm;
    }
}

module.exports = {
    Command,
    CEcho,
    CWhoIs,
    CFindWord,
    CBigWordCount,
    CHelp,
    CVersion,
    CFail,
    CBotErrors,
};
