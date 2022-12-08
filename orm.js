require("dotenv").config();
const pg = require("pg");
const client = new pg.Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_ENDPOINT}:${process.env.DB_PORT}/${process.env.DB_PATH}`,
});
client.connect();
class ORM {
    constructor(logger) {
        this.logger = new logger();
    }

    // If you ever have this bot accidentally put itself into the DB, call this. Change DISCORD_ID accordingly
    botErrors() {
        const bot_discord_id = process.env.BOT_DISCORD_ID;
        const checkBotError = async () => {
            const response = await client.query(
                `SELECT user_discord_id FROM users WHERE user_discord_id=$1`,
                [bot_discord_id]
            );
            return response?.rowCount > 0;
        };
        const deleteBotErrors = async () => {
            if (!(await checkBotError())) return;
            this.logger.warn("Found bot in db");
            await client.query(
                `DELETE FROM messages WHERE user_id=(SELECT user_id FROM users WHERE user_discord_id=$1)`,
                [bot_discord_id]
            );
            await client.query(`DELETE FROM users WHERE user_discord_id=$1`, [
                bot_discord_id,
            ]);
            this.logger.log("Deleted bot errors!");
        };
        return { deleteBotErrors };
    }
    messageData() {
        const logUserMessage = async (msg) => {
            if (msg?.author?.id == null) return;

            const filteredContent = msg.content
                .replace(/\`\`\`.*\`\`\`/gi, "CODE-BLOCK")
                .replace(/\<\@.*\>/gi, "MENTION-USER");

            //check user exists
            //todo: create user if not (SHOULD ALREADY EXIST)
            const userId = await client.query(
                "SELECT user_id FROM users WHERE user_discord_id=$1",
                [msg.author.id]
            );
            if (userId.rowCount < 1) return;
            await client.query(
                `INSERT INTO messages (message_content, message_timestamp, message_channel_id, user_id)
                VALUES ($1, $2, $3, $4)`,
                [
                    filteredContent,
                    msg.createdTimestamp,
                    msg.channelId,
                    userId.rows[0].user_id,
                ]
            );
            this.logger.log(
                `Added user message => "${
                    msg.author.username
                }" : ${filteredContent.slice(0, 15)}...`
            );
        };
        const isValidWordCheck = (word) => {
            const results = word.match(/[\<\>\[\]\(\)]/gi);
            if (!results) return false;
            return results?.length > 0;
        };
        const getMassiveWordCount = async (user, type, wordArg) => {
            if (!user) return 0;
            const response = await client.query(
                `SELECT me.message_content FROM messages me, users u
                WHERE me.user_id=u.user_id AND u.user_discord_id=$1`,
                [user]
            );
            // oof memory if db bloated
            if (response.rowCount < 1) return 0;
            const dict = {};
            response.rows.forEach((row) => {
                row.message_content.split(" ").forEach((word) => {
                    if (type === "length")
                        if (!wordArg || word.length < wordArg) return;
                    if (type === "word")
                        if (
                            !wordArg ||
                            word.toLowerCase() !== wordArg.toLowerCase()
                        )
                            return;
                    if (!(word in dict)) dict[word] = 1;
                    else dict[word]++;
                });
            });
            if (type !== "length")
                for (const word in dict) {
                    if (type === "amount")
                        if (dict[word] != wordArg) delete dict[word];
                    if (type === "amount-lt")
                        if (dict[word] >= wordArg) delete dict[word];
                    if (type === "amount-gt")
                        if (dict[word] <= wordArg) delete dict[word];
                }
            return dict;
        };
        const checkWordCount = async (word) => {
            if (
                !word ||
                typeof word !== "string" ||
                word.length < 3 ||
                isValidWordCheck(word)
            )
                return "Word too short, or in wrong format";
            const response = await client.query(
                `SELECT me.message_content, u.user_name, u.user_discord_id FROM messages me, users u
                WHERE me.message_content LIKE $1 AND u.user_id=me.user_id`,
                [`%${word}%`]
            );
            if (response.rowCount < 1) return "No results.";
            return response.rows;
        };
        return {
            logUserMessage,
            checkWordCount,
            getMassiveWordCount,
        };
    }
    userData() {
        // Log to user data
        const logUserData = async (user) => {
            const { id, bot, username, discriminator, avatar } = user;
            if (await checkIfUserExists(id)) {
                await updateUserData(id, username, avatar, discriminator);
                return;
            }
            await addUser(id, username, discriminator, bot, avatar);
        };
        const checkIfUserExists = async (id) => {
            const response = await client.query(
                "SELECT user_discord_id FROM users WHERE user_discord_id=$1",
                [id.toString()]
            );
            return response?.rowCount > 0;
        };
        const addUser = async (id, name, discrim, isBot, avatar) => {
            this.logger.log(`Creating user '${name}#${discrim}, ${id}`);
            await client.query(
                `INSERT INTO users (user_name, user_discord_id, user_discriminator, user_is_bot, user_avatar)
            VALUES ($1, $2, $3, $4, $5);`,
                [name, id, discrim, isBot, avatar]
            );
        };
        const updateUserData = async (id, name, avatar, discrim) => {
            this.logger.log(`Updating user '${name}#${discrim}, ${id}`);
            await client.query(
                "UPDATE users SET (user_name, user_avatar) = ($1, $2) WHERE user_discord_id=$3",
                [name, avatar, id]
            );
        };

        // Get from user data
        const getUserData = async (name) => {
            const queryName = Array.isArray(name) ? name[0] : name;
            const users = await queryUser(queryName);
            if (users == null) return "No users found.";
            return users;
        };
        const queryUser = async (name) => {
            if (!name || name.trim() == "" || name.trim().length < 5)
                return null;
            const response = await client.query(
                `SELECT
                    user_name, user_discord_id, user_discriminator, user_is_bot, user_avatar
                    FROM users WHERE user_name LIKE $1`,
                [`%${name}%`]
            );
            if (!response || response?.rowCount < 1) return null;
            return response.rows;
        };
        const getUserMessagesCount = async (id) => {
            if (!id) return 0;
            const response = await client.query(
                `SELECT COUNT(me.user_id) FROM messages me, users u WHERE me.user_id=u.user_id AND u.user_discord_id=$1`,
                [id]
            );
            return response?.rows?.[0]?.count;
        };
        return {
            logUserData,
            getUserData,
            getUserMessagesCount,
        };
    }
    // getUserAvatar() {
    //     // http://cdn.discordapp.com/avatars/USER_ID/USER_AVATAR
    // }
    // getMessageChannel() {
    //     // bot.channels.get("MESSAGE_CHANNEL_ID")
    // }
    // sanity() {
    //     client.query("select * from users");
    // }
}

module.exports = ORM;
