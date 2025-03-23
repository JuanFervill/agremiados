import {Sequelize} from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(process.env.BBDD,process.env.USER, process.env.PASSWORD,{
    host: process.env.HOST,
    port: 61002,
    dialect: 'mysql',
    define: {
        timestamps: true,
    },
    pool:{
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 100000,
    },
    operatorsAliases: false
});

export default db;