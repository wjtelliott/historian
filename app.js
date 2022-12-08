// CONFIG & MIDDLEWARE
require('dotenv').config();
const version = '1.0';
const { Client, GatewayIntentBits } = require('discord.js');
const Commands = require('./commands');
const ORM = require('./orm');
const Pretty = require('./pretty');
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});
const logger = new Pretty.Display();

// SET UP ORM AND VALID COMMANDS
const orm = new ORM(Pretty.Display);
const fail = new Commands.CFail(logger, bot);
const errors = new Commands.CBotErrors(logger, bot, orm);
const commandWrapper = [];
commandWrapper.push(new Commands.CWhoIs(Pretty.Display, bot, orm));
commandWrapper.push(new Commands.CEcho(Pretty.Display, bot));
commandWrapper.push(new Commands.CFindWord(Pretty.Display, bot, orm));
commandWrapper.push(new Commands.CBigWordCount(Pretty.Display, bot, orm));
commandWrapper.push(
  new Commands.CHelp(Pretty.Display, bot, orm, commandWrapper),
);
commandWrapper.push(new Commands.CVersion(Pretty.Display, bot, version));

// BOT IS READY
bot.on('ready', () => {
  logger.log('=== BOT LAUNCHED ===');
});

// BOT RECEIVED MESSAGE
bot.on('messageCreate', async (msg) => {
  if (msg.content[0] !== process.env.BOT_PREFIX) {
    //todo: this is the discrim for this bot. but its a magic number
    if (
      msg.author.bot &&
      msg.author.discriminator !== process.env.BOT_DISCRIMINATOR
    ) {
      logger.log('Bot message found.');
      logger.log(msg.author);
      return;
    } else if (msg.author.discriminator === process.env.BOT_DISCRIMINATOR)
      return;
    await orm.userData().logUserData(msg.author);
    await orm.messageData().logUserMessage(msg);
    return;
  }
  const userInput = msg.content.split(' ');
  const userCommand = userInput[0].slice(1);
  const userArgs = userInput.slice(1);

  //todo: magic number, move id to db?
  if (msg.author.id === process.env.DISCORD_ADMIN) {
    if (userCommand === 'leave') {
      await msg.reply('Yes, my Lord');
      throw new Error('Exiting...');
    }
    if (userCommand === 'errors') {
      await errors.callback(msg);
      return;
    }
  }
  if (
    !commandWrapper.some((cmd) => {
      if (cmd.prefix.toLowerCase() === userCommand.toLowerCase()) {
        cmd.callback(msg, userArgs);
        return true;
      }
      return false;
    })
  ) {
    await fail.callback(msg, `$${userCommand} ${userArgs.join(' ')}`);
  }
});

// BOT LOGIN
const login = async () => {
  logger.log('=== LOGGING IN ===');
  try {
    await bot
      .login(process.env.BOT_TOKEN)
      .then(() => logger.log('=== LOGIN PASS ==='));
  } catch (err) {
    logger.warn('=== LOGIN FAIL ===');
    logger.error(err);
    logger.log('Ignore below stack trace');
    throw new Error('LOGIN ERROR');
  }
};
login();
