import multer from "multer";
import path from "path";
import { Usuario } from "../models/usuarios.js";
import { Op } from "sequelize";
import fs from "fs";

const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "upload/perfiles");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = file.fieldname + '-' + Date.now() + ext;
        cb(null, uniqueName);

    }
});

const upload2 = multer({ storage: storage2 });

const storage3 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "upload/foto-eventos");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = file.fieldname + '-' + 'evento' + Date.now() + ext;
        cb(null, uniqueName);

    }
});

const upload3 = multer({ storage: storage3 });


export { upload2,
        upload3};