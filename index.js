import express from 'express';
import router from "./routers/index.js";
import db from "./config/db.js";
import dotenv from "dotenv";
import session from "express-session";
import './models/solicitudes.js';

dotenv.config();

const app = express(); //middleware

db.authenticate()
    .then(() => console.log('Conectado a la base de datos'))
    .catch(err => console.log(err));

const port = process.env.PORT || 61002;

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use(session(
    {
    secret: process.env.SECRET_SESSION,
        saveUninitialized: false,
        resave: false,
        name: 'session',
        cookie: { secure: false }
}));

app.use('/', router);

app.use("/upload", express.static("upload"));

app.listen(port, () => {
    console.log('SERVIDOR EN EL PUERTO' + port);
});
