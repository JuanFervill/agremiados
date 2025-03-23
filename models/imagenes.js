import Sequelize from "sequelize";
import db from "../config/db.js";
import {Usuario} from "./usuarios.js";

export const Imagen = db.define("imagenes",{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: "Usuario",
            key: 'id'
        }
    },
    titulo:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    artesania:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    desc:{
        type: Sequelize.DATE,
        allowNull: false,
    },
    nombreimg:{
        type: Sequelize.STRING,
        allowNull: false,
    }
}, {
    tableName: 'imagen',
    timestamps: false
});

Imagen.sync({ alter: true }).catch(console.error);