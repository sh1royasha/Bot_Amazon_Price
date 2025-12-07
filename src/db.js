const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


async function getProductsByChat(chatId) {
    const { data, error} = await supabase
    .from("Productos")
    .select("*")
    .eq("chat_id", chatId);

    if(error) throw error
    return data;
}

async function addProduct(chat_id, nombre, link, price, fecha){
    const { data, error } = await supabase
    .from("Productos")
    .insert([
              { chat_id: chat_id, nombre: nombre, link: link, precio_actual: price, fecha_registro: fecha, precio_actual: price, precio_mas_bajo:price}

    ]);

    if(error) throw error
    return data[0];
}

async function deleteProduct(chat_id, link){
    const { error } = await supabase
    .from("Productos")
    .delete()
    .eq("chat_id",chat_id)
    .eq("link", link);

    if (error) throw error;
    return true;
}

async function updatePrice(chat_id, link, newPrice){
    const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("chat_id", chat_id)
    .eq("link", link)
    .single();

    if (error) throw error;

    const oldPrice = parseFloat(data.precio_actual);

    if (oldPrice === newPrice) {
        console.log("El precio no cambió, no se actualiza");
        return false;
    }

    const updates = { precio_actual: newPrice };

    if (newPrice < parseFloat(data.precio_mas_bajo)) {
        updates.precio_mas_bajo = newPrice;
        updates.fecha_precio_mas_bajo = new Date().toISOString();
    }

    if (newPrice > parseFloat(data.precio_mas_alto)) {
        updates.precio_mas_alto = newPrice;
        updates.fecha_precio_mas_alto = new Date().toISOString();
    }

     const { error: err2 } = await supabase
    .from("productos")
    .update(updates)
    .eq("chat_id", chatId)
    .eq("link", url);

    if (err2) throw err2;

    return true;
    
}

module.exports = { getProductsByChat, addProduct, deleteProduct, updatePrice };
