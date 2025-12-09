const cron = require("node-cron");
const { getAmazonPrice } = require("./amazon");
const bot = require("./bot");

// Supabase
const { getAllProducts, updatePrice,cleanPrice } = require("./db");

console.log("Checker activo...");


cron.schedule("0 * * * *", async () => {
    console.log("Revisando precios...");

    try {
        const productos = await getAllProducts();

        if (!productos || productos.length === 0) {
            console.log("No hay productos registrados.");
            return;
        }

        for (const producto of productos) {
            const {price} = await getAmazonPrice(producto.link);

                if (!price) {
                    console.log(`No pude obtener precio para: ${producto.link}`);
                    continue;
                }

                const clean = cleanPrice(price);  
                
                if (!clean) {
                    console.log(`Precio inválido: ${price}`);
                    continue;
                }

                if (clean !== parseFloat(producto.precio_actual)) {

                    await updatePrice(producto.chat_id, producto.link, clean);

                    bot.sendMessage(
                    producto.chat_id,
                    `🔔 *Cambio detectado en un producto:*\n\n` +
                    `🔗 ${producto.link}\n` +
                    `💲 Precio antes: ${producto.precio_actual}\n` +
                    `💲 Precio ahora: *${clean}*`,
                    { parse_mode: "Markdown" }
                    );

                    console.log(`Precio actualizado: ${producto.link}`);
                }
        }

    } catch (error) {
        console.error("Error en checker:", error);
    }
});
