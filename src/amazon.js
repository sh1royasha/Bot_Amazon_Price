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

        const priceWhole = $("span.a-price-whole").first().text().trim();
        const priceFraction = $("span.a-price-fraction").first().text().trim() || "00";

        let raw = priceWhole + "." + priceFraction;      // ej: "17,740" + ".99" => "17,740.99"
        raw = raw.replace(/[.,]/g, (m, i, s) => i < s.length - 3 ? "" : "."); 
        // Esto quita comas de miles y deja solo el punto decimal

        const price = parseFloat(raw);

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