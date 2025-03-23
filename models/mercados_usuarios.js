import Sequelize from "sequelize";
import db from "../config/db.js";
import {Usuario} from "./usuarios.js";
import {Mercado} from "./mercados.js";

export const Mercado_Usuario = db.define("mercados_usuarios",{}, {
    tableName: 'mercados_usuarios2',
    timestamps: false
});
Usuario.belongsToMany(Mercado, {through: Mercado_Usuario});
Mercado.belongsToMany(Usuario, {through: Mercado_Usuario});

Mercado_Usuario.sync({ alter: true }).catch(console.error);