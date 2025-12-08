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

        const price =
            $("#corePrice_feature_div .a-price .a-price-whole").text().trim() ||
            $("#priceblock_ourprice").text().trim() ||
            $("#priceblock_dealprice").text().trim();

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