const fs = require("fs-extra");
const cron = require("node-cron");
const { getAmazonPrice } = require("./amazon");
const TelegramBot = require("node-telegram-bot-api");

const DB_PATH = "./src/db.json";

const bot = new TelegramBot(process.env.BOT_TOKEN);

cron.schedule("0 * * * *", async () => {
    console.log("Revisando precios...");

    const db = await fs.readJSON(DB_PATH);

    for (let product of db.products) {
        const newPrice = await getAmazonPrice(product.url);

        if (!newPrice) continue;

        if (newPrice !== product.lastPrice) {
            bot.sendMessage(
                product.chatId,
                `⚠️ ¡Precio cambió!\nAntes: ${product.lastPrice}\nAhora: ${newPrice}\n${product.url}`
            );

            product.lastPrice = newPrice;
        }
    }

    await fs.writeJSON(DB_PATH, db, { spaces: 2 });
});
