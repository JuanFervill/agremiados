import multer from "multer";
import path from "path";
import { Usuario } from "../models/usuarios.js";
import { Op } from "sequelize";
import fs from "fs";

// Crear carpeta 'upload' si no existe
const dir = './upload';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "upload/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = file.fieldname + '-' + Date.now() + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

export {
    upload,
    storage
};