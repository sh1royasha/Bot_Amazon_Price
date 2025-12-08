const { createClient } = require("@supabase/supabase-js");


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-client-info": "supabase-js-node"
      }
    }
  }
);

function nowLocalString() {
    const d = new Date();

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}




async function getProductsByChat(chat_id) {
    const { data, error} = await supabase
    .from("Productos")
    .select("*")
    .eq("chat_id", chat_id);

    if(error) throw error
    return data;
}

async function addProduct(chat_id, nombre, link, price){
  const fecha = nowLocalString();

    const { data, error } = await supabase
  .from("Productos")
  .insert([
    {
      chat_id,
      nombre,
      link,
      precio_actual: price,
      precio_mas_bajo: price,
      precio_mas_alto: price,
      fecha_precio_mas_bajo: fecha,
      fecha_precio_mas_alto: fecha,
      fecha_registro: fecha,
      ultima_actualizacion: fecha,
    }
  ])
  .select();

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
    .from("Productos")
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
    .from("Productos")
    .update(updates)
    .eq("chat_id", chat_id)
    .eq("link", link);

    if (err2) throw err2;

    return true;
    
}

async function getAllProducts() {
    const { data, error } = await supabase
        .from("Productos")
        .select("*");

    if (error) {
        console.error("Error al obtener todos los productos:", error);
        return [];
    }

    return data;
}

function cleanPrice(rawPrice) {
    if (!rawPrice || typeof rawPrice !== "string") {
        console.log("❌ Precio inválido:", rawPrice);
        return null;
    }

    let cleaned = rawPrice
        .replace(/[^\d.,]/g, "")  // elimina cualquier cosa que no sea número/coma/punto
        .trim();

    // Reemplazo de miles → decimal
    cleaned = cleaned.replace(/,/g, "");
    cleaned = cleaned.replace(/(\d)\.(\d{2})$/, "$1.$2");

    return cleaned;
}


module.exports = { getProductsByChat, addProduct, deleteProduct, updatePrice,getAllProducts,cleanPrice };
