const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const { getAmazonPrice } = require("./amazon");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const DB_PATH = "./src/db.json";

// Guarda el estado temporal de cada usuario
const userState = {}; // { chatId : "adding" | "deleting" | "price" }

b// ---------------------------
// /start
// ---------------------------
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "👋 Hola! Soy tu bot para monitorear precios de Amazon.\n\nUsa /menu para ver las opciones."
    );
});

// ---------------------------
// /menu
// ---------------------------
bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "📌 Menú principal", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "➕ Agregar producto", callback_data: "add" }],
                [{ text: "📋 Listar productos", callback_data: "list" }],
                [{ text: "❌ Eliminar producto", callback_data: "delete" }],
                [{ text: "💲 Consultar precio actual", callback_data: "price" }]
            ]
        }
    });
});

// ---------------------------
// Botones del menú
// ---------------------------
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "add") {
        userState[chatId] = "adding";
        return bot.sendMessage(chatId, "📥 Envíame el link del producto de Amazon:");
    }

    if (data === "list") {
        const db = await fs.readJSON(DB_PATH);

        const productos = db.products.filter(p => p.chatId === chatId);

        if (productos.length === 0)
            return bot.sendMessage(chatId, "📭 No tienes productos guardados.");

        let text = "📋 *Tus productos registrados:*\n\n";
        productos.forEach((p, i) => {
            text += `${i + 1}. ${p.url}\nPrecio guardado: ${p.lastPrice}\n\n`;
        });

        return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    }

    if (data === "delete") {
        userState[chatId] = "deleting";
        return bot.sendMessage(chatId, "🗑 Envíame el número del producto a eliminar.\nUsa *'/menu → Listar productos'* para ver los números.", { parse_mode: "Markdown" });
    }

    if (data === "price") {
        userState[chatId] = "price";
        return bot.sendMessage(chatId, "💲 Envíame el link del producto para consultar su precio actual.");
    }
});

// ---------------------------
// Procesar mensajes según estado
// ---------------------------
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    if (!text) return;

    const state = userState[chatId];

    // ---------------------------
    // 1. AGREGAR PRODUCTO
    // ---------------------------
    if (state === "adding") {
        if (!text.startsWith("http")) {
            return bot.sendMessage(chatId, "❌ Link inválido. Envía un link completo de Amazon.");
        }

        const db = await fs.readJSON(DB_PATH);

        // Evitar repetidos
        const existe = db.products.some(p => p.url === text && p.chatId === chatId);
        if (existe) {
            userState[chatId] = null;
            return bot.sendMessage(chatId, "⚠️ Este producto ya está registrado.");
        }

        const precio = await getAmazonPrice(text);
        if (!precio) {
            userState[chatId] = null;
            return bot.sendMessage(chatId, "❌ No pude obtener el precio. Verifica el link.");
        }

        db.products.push({
            url: text,
            lastPrice: precio,
            chatId
        });

        await fs.writeJSON(DB_PATH, db, { spaces: 2 });

        userState[chatId] = null;
        return bot.sendMessage(chatId, `✔ Producto agregado.\nPrecio detectado: ${precio}`);
    }

    // ---------------------------
    // 2. ELIMINAR PRODUCTO
    // ---------------------------
    if (state === "deleting") {
        const num = parseInt(text);

        const db = await fs.readJSON(DB_PATH);
        const productos = db.products.filter(p => p.chatId === chatId);

        if (isNaN(num) || num < 1 || num > productos.length) {
            return bot.sendMessage(chatId, "❌ Número inválido.");
        }

        const eliminado = productos[num - 1];

        // Eliminar del JSON
        db.products = db.products.filter(p => !(p.chatId === chatId && p.url === eliminado.url));

        await fs.writeJSON(DB_PATH, db, { spaces: 2 });

        userState[chatId] = null;
        return bot.sendMessage(chatId, `🗑 Eliminado:\n${eliminado.url}`);
    }

    // ---------------------------
    // 3. CONSULTAR PRECIO ACTUAL
    // ---------------------------
    if (state === "price") {
        if (!text.startsWith("http")) {
            return bot.sendMessage(chatId, "❌ Link inválido.");
        }

        const precio = await getAmazonPrice(text);
        userState[chatId] = null;

        if (!precio)
            return bot.sendMessage(chatId, "❌ No pude obtener el precio.");

        return bot.sendMessage(chatId, `💲 Precio actual: *${precio}*`, { parse_mode: "Markdown" });
    }
});

// Exportamos el bot para usarlo en checker.js
module.exports = bot;
