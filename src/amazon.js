const axios = require("axios");
const cheerio = require("cheerio");

async function getAmazonPrice(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "es-ES,es;q=0.9",
            },
            timeout: 12000,
        });

        const $ = cheerio.load(data);

        const priceOffscreen = $('span.a-offscreen').first().text().trim();
const priceWhole = $('span.a-price-whole').first().text().trim();
const priceFraction = $('span.a-price-fraction').first().text().trim();

let rawPrice =
    priceOffscreen ||
    (priceWhole ? `${priceWhole}.${priceFraction || "00"}` : null);

if (!rawPrice) {
    console.log("❌ No se encontró precio en la página");
}

        const title =
            $("#productTitle").text().trim() ||            // Título estándar
            $("span#title").text().trim() ||               // Alternativo
            $("h1.a-size-large").text().trim();            // Backup por si Amazon cambia


        return {
            price: price || null,
            title: title || null
        }

    } catch (err) {
        console.log("Error Amazon:", err.message);
        return { price: null, title: null };
    } 
}

module.exports = { getAmazonPrice };