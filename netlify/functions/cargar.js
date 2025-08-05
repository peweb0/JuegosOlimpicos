const fs = require("fs");
const path = require("path");

exports.handler = async () => {
    const filePath = path.join(__dirname, "..", "..", "datos.json");

    try {
        const contenido = fs.readFileSync(filePath, "utf8");
        return {
            statusCode: 200,
            body: contenido,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: "Error al cargar los datos",
        };
    }
};
