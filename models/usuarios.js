import Sequelize from "sequelize";
import db from "../config/db.js";

export const Usuario = db.define("usuarios",{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    contrasenia:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    artesania:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    email:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    rol:{
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user'
    },
    fotoPerfil:{
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pofile.png'
    }
}, {
    tableName: 'usuarios',
    timestamps: false
});

Usuario.sync({ alter: true }).catch(console.error);