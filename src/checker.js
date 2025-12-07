const cron = require("node-cron");
const { getAmazonPrice } = require("./amazon");
const bot = require("./bot");

// Supabase
const { getAllProducts, updatePrice } = require("./db");

console.log("Checker activo...");


cron.schedule("0 * * * *", async () => {
    console.log("Revisando precios...");

    try {
        const productos = await getAllProducts();

        if (!productos || productos.length === 0) {
            console.log("No hay productos registrados.");
            return;
        }

        for (const p of productos) {
            const newPrice = await getAmazonPrice(p.link);

                if (!newPrice) {
                    console.log(`No pude obtener precio para: ${p.link}`);
                    continue;
                }

                if (parseFloat(newPrice) !== parseFloat(p.precio_actual)) {

                    await updatePrice(p.chat_id, p.link, newPrice);

                    bot.sendMessage(
                    p.chat_id,
                    `🔔 *Cambio detectado en un producto:*\n\n` +
                    `🔗 ${p.link}\n` +
                    `💲 Precio antes: ${p.precio_actual}\n` +
                    `💲 Precio ahora: *${newPrice}*`,
                    { parse_mode: "Markdown" }
                    );

                    console.log(`Precio actualizado: ${p.link}`);
                }
        }

    } catch (error) {
        console.error("Error en checker:", error);
    }
});
