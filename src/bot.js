const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const { getAmazonPrice } = require("./amazon");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const DB_PATH = "./src/db.json";

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "Envíame un link de Amazon y lo agregaré para monitoreo cada hora."
    );
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (!text.startsWith("http")) return;

    const db = await fs.readJSON(DB_PATH);

    const precio = await getAmazonPrice(text);

    if (!precio) {
        bot.sendMessage(chatId, "No pude obtener el precio.");
        return;
    }

    db.products.push({
        url: text,
        lastPrice: precio,
        chatId: chatId,
    });

    await fs.writeJSON(DB_PATH, db, { spaces: 2 });

    bot.sendMessage(
        chatId,
        `Producto agregado.\nPrecio detectado: ${precio}\nLo revisaré cada hora.`
    );
});

module.exports = bot;
