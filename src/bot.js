const TelegramBot = require("node-telegram-bot-api"); //Biblioteca pra bots telegram
const { getAmazonPrice } = require("./amazon"); // Funcion que extrae precio de amazon

const { addProduct,getProductsByChat,deleteProduct,cleanPrice } = require("./db"); //Funciones de la bd

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });


// Guarda el estado temporal de cada usuario
const userState = {}; // { chatId : "adding" | "deleting" | "price" }

// ---------------------------
// /start  comando
// ---------------------------
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "👋 Hola! Soy tu bot para monitorear precios de Amazon.\n\nUsa /menu para ver las opciones."
    );
});

// ---------------------------
// /menu comando
// ---------------------------
bot.onText(/\/menu/, (msg) => {
     showMenu(msg.chat.id);
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

        const productos = await getProductsByChat(chatId);

        if (!productos || productos.length === 0)
            return bot.sendMessage(chatId, "No tienes productos guardados.");

        let text = " *Tus productos registrados:* \n\n";
        productos.forEach((p, i) => {
            text += `${i + 1}. ${p.nombre ?? "Sin nombre"}\n`;
            text += `🔗 ${p.link}\n`;
            text += `💲 Precio actual: ${p.precio_actual}\n\n`;
        });

        return bot.sendMessage(chatId, text, { parse_mode: "Markdown" })
        .then(()=> bot.sendMessage(chatId, "¿Qué deseas hacer ahora?"))
        .then(() => showMenu(chatId));;
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
    try{

        if (msg.via_bot || msg.data) return;

    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    if (!text) return;

    if (text.startsWith("/")) return;

    const state = userState[chatId];

    // ---------------------------
    // 1. AGREGAR PRODUCTO
    // ---------------------------
    if (state === "adding") {
        if (!text.startsWith("http")) {
            return bot.sendMessage(chatId, "❌ Link inválido. Envía un link completo de Amazon.");
        }

        
        const productos = await getProductsByChat(chatId);

        // Evitar repetidos
        const existe = productos.some(p => p.link === text);
        if (existe) {
            userState[chatId] = null;
            return bot.sendMessage(chatId, "⚠️ Este producto ya está registrado.");
        }

        const {price, title} = await getAmazonPrice(text);

        const clean = cleanPrice(price);

        if (!clean || !title) {
            userState[chatId] = null;
            return bot.sendMessage(chatId, "❌ No pude obtener el precio o el nombre del producto.");
        }

        await addProduct(chatId, title, text, clean);

        userState[chatId] = null;
        return bot.sendMessage(chatId, `✔ Producto agregado.\nPrecio detectado: ${clean}`)
        .then(()=> bot.sendMessage(chatId, "¿Qué deseas hacer ahora?"))
        .then(() => showMenu(chatId));
    }

    // ---------------------------
    // 2. ELIMINAR PRODUCTO
    // ---------------------------
    if (state === "deleting") {
        const num = parseInt(text);

        const productos = await getProductsByChat(chatId);

        if (!productos || isNaN(num) || num < 1 || num > productos.length) {
                return bot.sendMessage(chatId, "❌ Número inválido.");
            }

        const eliminado = productos[num - 1];

        await deleteProduct(chatId, eliminado.link);

        userState[chatId] = null;
        return bot.sendMessage(chatId, `🗑 Eliminado:\n${eliminado.link}`)
        .then(()=> bot.sendMessage(chatId, "¿Qué deseas hacer ahora?"))
        .then(() => showMenu(chatId));;
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

        return bot.sendMessage(chatId, `💲 Precio actual: *${precio}*`, { parse_mode: "Markdown" })
        .then(()=> bot.sendMessage(chatId, "¿Qué deseas hacer ahora?"))
        .then(() => showMenu(chatId));;
    }

    return bot.sendMessage(chatId, "❓ No entendí eso.\nUsa /menu para ver las opciones.");
 

    } catch(err){
        console.error("❌ ERROR EN BOT:", err);
        bot.sendMessage(
        msg.chat.id,
        "⚠️ Ocurrió un error procesando tu solicitud."
        );
    }
});

function showMenu(chatId) {
    return bot.sendMessage(chatId, "📌 Menú principal", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "➕ Agregar producto", callback_data: "add" }],
                [{ text: "📋 Listar productos", callback_data: "list" }],
                [{ text: "❌ Eliminar producto", callback_data: "delete" }],
                [{ text: "💲 Consultar precio actual", callback_data: "price" }]
            ]
        }
    });
}


// Exportamos el bot para usarlo en checker.js
module.exports = bot;

