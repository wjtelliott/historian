# Commands Documentation

Initialize a new command with the following, remember to
export it on your `commands.js` file, as well as add it to the
`commandsWrapper` array in `app.js`

This command will be ran by a user typing `$my-new-command`,
replacing the dollar sign with your prefix. The bot will reply
to your message with `Hello World!`

```js
class CMyNewCommand extends Command {
  constructor(logger, bot, orm) {
    /* All commands need logger/bot passed in super(). */

    async function run(target, userArgs) {
      /* Code for your command will go here.
            target will reference the discord message object.
            userArgs will reference user input as Array<string> */

      await target.reply(`Hello World!`);
    }
    super('my-new-command', run, logger, bot);
    this.orm = orm;
    this.getHelpMessage = () => 'My new command!';
  }
}
```

```yaml
In the above example, user input: '$my-new-command arg1 arg2 lastArg'
userArgs expectation: ['arg1', 'arg2', 'lastArg']
```

### Commands can call ORM such as:

```js
// These returns and inputs will be abstracted in next update.

// Error fix if bot logs itself
orm.botErrors().deleteBotErrors();

// Get Data
orm.messageData().checkWordCount(word: String | Array<string>): String | Array<Object>
orm.messageData().getMassiveWordCount(user: DiscordUser, type: String, wordArg: String): Number | Object
orm.userData().getUserData(name: String): String | Array<Object>
orm.userData().getUserMessageCount(id: String): null | Number

// Log Data
orm.messageData().logUserMessage(msg: DiscordMessage): void
orm.userData().logUserData(user: DiscordUser): void
```
