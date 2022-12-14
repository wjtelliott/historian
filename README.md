# ๐ค Historian DiscordBot

A discord.js bot designed to log, store, and display
information about users and their messages they type.

## ๐ฑโ๐ป Features

- Read/Send messages in discord channels
- Send custom embeds for user profiles
- Save users and user messages to PostgreSQL database
- Retrieve most common said words & phrases from users

## ๐ฝ Installed NodeModules

Project version: `1.0`
Node version: `16.16.0`

| Package    | Version  |
| ---------- | -------- |
| axios      | `1.2.0`  |
| discord.js | `14.7.1` |
| dotenv     | `16.0.3` |
| pg         | `8.8.0`  |

## ๐ป Run Project

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

- Make sure to create your PostgreSQL server with the `database.sql` file!

Start the bot

```bash
  npm run start
```

**Make sure to create a .env file with the
following contents, example below**

```bash
    BOT_TOKEN=token
    DB_USER=postgres
    DB_PASS=postgres
    DB_PATH=historian
    DB_ENDPOINT=localhost
    DISCORD_ADMIN=000000000000000000
    BOT_DISCORD_ID=111111111111111111
    BOT_DISCRIMINATOR=1234
    BOT_PREFIX=$
```

## ๐ง Roadmap

- Create a more styled user embed
  - "User profile" look
  - Links to discord profile
- Sanitize user input
  - Add TypeScript?
- Cross-Channel support
- Log users into database as bot enters new server
- Jest testing
- Axios/Express server-side

## ๐ง Optimizations

- A few TODO's running around
- Cleaning up the typing and checking for correct args
- Sanitizing user input could be better

## ๐งช Running Tests

**This feature is not yet implemented**

To run tests, run the following command

```bash
  npm run test
```

- Store all jest files in the `__tests__` folder

## ๐จโ๐ป Authors

- [@william-elliott](https://www.github.com/wjtelliott)

## ๐ About Me

I'm a full stack developer, currently employed as
a JavaScript programmer. I also develop games in
my free time.

Feel free to message me
questions and contributions to this bot.
