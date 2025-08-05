const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Método no permitido",
        };
    }

    const data = JSON.parse(event.body);
    const filePath = path.join(__dirname, "..", "..", "datos.json");

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return {
            statusCode: 200,
            body: JSON.stringify({ mensaje: "Datos guardados correctamente" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: "Error al guardar los datos",
        };
    }
};
