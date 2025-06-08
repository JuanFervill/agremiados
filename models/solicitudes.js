import Sequelize from "sequelize";
import db from "../config/db.js";
import {Usuario} from "./usuarios.js";
import {Mercado} from "./mercados.js";

export const Solicitud = db.define("solicitudes",{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'id'
        }
    },
    mercado:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Mercado,
            key: 'id'
        }
    },
    nombremercado:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    respuesta:{
        type: Sequelize.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'solicitudes',
    timestamps: false
});

Solicitud.sync({ alter: true }).catch(console.error);