const fs = require("fs-extra");
const cron = require("node-cron");
const { getAmazonPrice } = require("./amazon");

// IMPORTA el bot en lugar de crear otro
const bot = require("./bot");

const DB_PATH = "./src/db.json";

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
