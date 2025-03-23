import Sequelize from "sequelize";
import db from "../config/db.js";

export const Mercado = db.define("mercados",{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    fecha:{
        type: Sequelize.DATE,
        allowNull: false,
    },
    ubicacion:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    ubi_param:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    descripcion:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    imagen:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    capacidad:{
        type: Sequelize.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'mercados',
    timestamps: false
});

Mercado.sync({ alter: true }).catch(console.error);