import {Sequelize} from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(process.env.CONEXION,{
    define: {
        timestamps: true,
    },
    pool:{
        max: 15,
        min: 0,
        acquire: 30000,
        idle: 100000,
    },
    operatorsAliases: false
});

export default db;