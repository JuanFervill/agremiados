import moment from "moment";
import { Usuario } from "../models/usuarios.js";
import { Imagen } from "../models/imagenes.js";
import { Mercado } from "../models/mercados.js";
import {Mercado_Usuario} from "../models/mercados_usuarios.js";
import puppeteer from "puppeteer";
import fs from 'fs/promises';
import path from "path";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const userGmail = process.env.USER_MAIL;
const passAppGmail = process.env.PASSWORD_MAIL;
let mercadosDisponibles;
let arteDisponible;
let nombreUsers = [];

// Declaramos el transporter que usaremos para enviar el correo con nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: userGmail,
        pass: passAppGmail,
    },
});

const paginaInicio = async (req, res) => {
    // Verificar si el usuario ha iniciado sesión
    if (req.session.userId) {
        console.log("Id actual:", req.session.userId);
    } else {
        console.log("No hay sesión");
    }

    res.render('inicio', {
        nombreP: "Inicio",
        pagina: "Inicio",
        clase: "home",
        user: req.session.user,
        userid: req.session.userId
    });
};

const listaEventos = async (req, res) => {
    const pageSize = 5;
    const page = Number(req.params.page);
    let posts;
    let max=page;
    let maxPag = 1;
    if(req.session.userId) {
        //Obtenemos todos los mercados a los que se ha apuntado el usuario registrado
        posts = await Mercado.findAll({
            include: [{
                model: Usuario,
                where: {id: req.session.userId}
            }],
            //con offset declaramos a partir de que registro empezamos a contar para no traer los que ya tenemos
            //con limit declaramos el número de registros que traemos, en este caso 5
            offset: (page - 1) * pageSize,
            limit: pageSize
        })
        //Obtenemos el número total de registros de mercados a los que se ha apuntado el usuario
        max = await Mercado.count({
            include: [{
                model: Usuario,
                where: {id: req.session.userId}
            }]
        })
        /*En maxPag almacenamos el número total de páginas que muestra la paginación, con Math.ceil redondea hacia
        arriba, así aunque en la ultima página no haya 5 registros nos contará que está ahí*/
        maxPag = Math.ceil(max/pageSize);
    }else{
        posts = null;
    }

    /*prev y next hacen que no podamos volver atráss si estamos en la pagina 1 haciendolo undefined, en la view
    se controla que si estamos en la primera pagina no muestre el botón de previo, y lo mismo con la ultima
    con el de siguiente*/
        const prev = page === 1 ? undefined : page - 1;
        const next = page + 1;

        res.render('listaEventos',{
            nombreP: "Eventos",
            pagina: "Eventos",
            user: req.session.user,
            userid: req.session.userId,
            mercados: posts,
            prev: prev,
            sig: next,
            page: page,
            max: maxPag,
            moment: moment
        });
}

const eventosDisp = async function (req, res) {
    const pageSize = 8;
    const page = Number(req.params.page);
    let posts;
    let maxPag = 1;
    let max = page;
        posts = await Mercado.findAll({
            offset: (page - 1) * pageSize,
            limit: pageSize
        })

    max = await Mercado.count({});
    maxPag = Math.ceil(max/pageSize);
    const prev = page === 1 ? undefined : page - 1;
    const next = page + 1;
    res.render('eventos', {
        nombreP: "EventosDisponibles",
       pagina: "EventosDisponibles",
        user: req.session.user,
        userid: req.session.userId,
        mercados: posts,
        prev: prev,
        sig: next,
        page: page,
        max: maxPag
    })
}

const paginaArte  = async (req, res) => {
    const pageSize = 6;
    const page = Number(req.params.page);
    let posts;
    let maxPag = 1;
    let max = page;
    if(req.session.userId) {
        arteDisponible = await Imagen.findAll({
            where: {
                //excluimos las imaenes que pertenezcan al usuario registrado
                usuario: { [Op.ne]: req.session.userId },
            },
            offset: (page - 1) * pageSize,
            limit: pageSize
        });
        max = await Imagen.count({
            where: {
                usuario: { [Op.ne]: req.session.userId },
            }
        });
    }else{
        //si no hay ninguno usuario con la sesion iniciada obtiene todas las iamgenes
        arteDisponible = await Imagen.findAll({
            offset: (page - 1) * pageSize,
            limit: pageSize
        });
        max = await Imagen.count({
            offset: (page - 1) * pageSize,
            limit: pageSize
        });
    }
    /*Recorremos todo lo obtenido para almacenar en un array todos los usuarios que hayan posteado arte,
    esto es porque en imagenes solo almacenamos el id del usuario no el nombre, así le pasamos a la view
    este array y sustituimos el id por el nombre*/
    if (arteDisponible.length > 0) {
        for(let i = 0; i < arteDisponible.length; i++) {
            nombreUsers[arteDisponible[i].usuario] = await Usuario.findOne({
                where: {
                    id: arteDisponible[i].usuario,
                }
            })
        }
    }
    maxPag = Math.ceil(max/pageSize);
    const prev = page === 1 ? undefined : page - 1;
    const next = page + 1;
    res.render('arte', {
        nombreP: "Arte",
        pagina: "Arte",
        user: req.session.user,
        userid: req.session.userId,
        imagenes: arteDisponible,
        usuarios: nombreUsers,
        prev: prev,
        sig: next,
        page: page,
        max: maxPag
    })
}

const infoEvento = async (req, res) => {
    const id = req.params.id;
    const mercado = await Mercado.findOne({where: {id: id}});
    const clave_api = process.env.KEY_API;
    let apuntado = false;
    try{
        //Comprobamos si el usuario registrado se ha apuntado al evento
        const apuntados = await Mercado.findAll({
            where: {id: id},
            include: [{
                model: Usuario,
                where: {id: req.session.userId}
            }]
        })
        if(apuntados.length > 0){
            apuntado=true;
        }else {
            apuntado = false;
        }
    }catch(err){
        console.log(err);
    }
    res.render('infoEvento', {
        nombreP: "infoEvento",
        pagina: "infoEvento",
        user: req.session.user,
        userid: req.session.userId,
        mercado: mercado,
        apuntado: apuntado,
        moment: moment,
        clave_api: clave_api
    })
}

const apuntarse  = async (req, res) => {
    const mercado = req.params.id;
    const usuario = req.session.userId;
    const user = req.session.user;
    try{
        const mercado_user = await Mercado_Usuario.create({usuarioId: usuario, mercadoId: mercado});
        const mercadoNuevo = await Mercado.findOne({
            where: {id: mercado}
        });
        await Mercado.update({capacidad: (mercadoNuevo.capacidad-1)}, {where: {id: mercado}});
        console.log("Vamos a añadir " + mercadoNuevo.nombre);
        //En plantillMail se guarda la ruta el html de la plantilla para el pdf y el mail al apuntarse
        const plantillaMail = path.join(process.cwd(), 'views', 'plantillaPDF.html');
        //se lee el archivo y se guarda en contenidoMail
        let contenidoMail = await fs.readFile(plantillaMail, 'utf8');
        //las variables que habiamos puesto en la plantilla la sustituimos ahora por la info correspondiente
        console.log("url imagen " + mercadoNuevo.imagen);
        contenidoMail = contenidoMail.replace('{{FOTO}}', mercadoNuevo.imagen);
        contenidoMail = contenidoMail.replace('{{ARTESANO}}', user.nombre);
        contenidoMail = contenidoMail.replace('{{ARTESANO}}', user.nombre);
        contenidoMail = contenidoMail.replace('{{ARTESANIA}}', user.artesania);
        contenidoMail = contenidoMail.replace('{{EVENTO}}', mercadoNuevo.nombre);
        contenidoMail = contenidoMail.replace('{{EVENTO}}', mercadoNuevo.nombre);
        contenidoMail = contenidoMail.replace('{{UBICACION}}', mercadoNuevo.ubicacion);
        contenidoMail = contenidoMail.replace('{{FECHA}}', moment(mercadoNuevo.fecha).format('DD/MM/YYYY, h:mm a'));

        const enviado = await enviaMail(req.session.user.email,'Reserva de stand',contenidoMail);

        if(enviado){
            console.log("Email enviado");
        }else {
            console.log("fallo al enviar");
        }

        try{
            //launch crea una instancia en el navegador y page es la pestaña que abrirá el pdf
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            //cargamos la plantilla del correo y el buffer crea un pdf de tamaño a5, después el browser se cierra
            await page.setContent(contenidoMail, {waitUntil: 'networkidle0'});
            const buffer = await page.pdf({format: 'A5', printBackground: true});
            await browser.close();
            //enviamos como respuesta el pdf creado por el buffer
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');
            res.end(buffer);
        }catch (err){
            console.error(err);
        }

    }catch(err){
        console.log(err);
        return res.render('error', {
            nombreP: "Error",
            pagina: "Error",
            proceso: "Reserva de stand en evento",
            errorDatos: err,
            user: req.session.user,
            userid: req.session.userId
        });
    }
}

const anularEvento = async (req, res) => {
    const mercado = req.params.id;
    try{
        await Mercado_Usuario.destroy({where: {mercadoId: mercado}});
        const mercadoAnulado = await Mercado.findOne({where: {id: mercado }});
        await Mercado.update({capacidad: (mercadoAnulado.capacidad+1)}, {where: {id: mercado}});
        console.log("Anulado: " + mercadoAnulado.nombre);

        const plantillaMail = path.join(process.cwd(), 'views', 'plantillaEmail.html');
        let contenidoMail = await fs.readFile(plantillaMail, 'utf8');
        contenidoMail = contenidoMail.replace('{{FOTO}}', mercadoAnulado.imagen);
        contenidoMail = contenidoMail.replace('{{ARTESANO}}', req.session.user.nombre);
        contenidoMail = contenidoMail.replace('{{EVENTO}}', mercadoAnulado.nombre);
        contenidoMail = contenidoMail.replace('{{EVENTO}}', mercadoAnulado.nombre);

        const enviado = await enviaMail(req.session.user.email,'Anulación de evento',contenidoMail);

        if(enviado){
            console.log("Email enviado");
        }else {
            console.log("fallo al enviar");
            return res.render('error', {
                nombreP: "Error",
                pagina: "Error",
                proceso: "Anulación de evento",
                errorDatos: "No se ha podido enviar el correo electrónico confirmando la cancelación, compruebe en 'Mis eventos' si se aún así la anulación se ha llevado a cabo",
                user: req.session.user,
                userid: req.session.userId
            });
        }
        res.redirect('/listaEventos/1');
    }catch(err){
        console.error(err);
        return res.render('error', {
            nombreP: "Error",
            pagina: "Error",
            proceso: "Anulación de evento",
            errorDatos: err,
            user: req.session.user,
            userid: req.session.userId
        });
    }
}

async function enviaMail(mail, asunto, contenido){
    try{

        //declaramos la info del correo que vamos a enviar mediante los parametros que pasamos conla funcion
        const mailOptions = {
            from: userGmail,
            to: mail,
            subject: asunto,
            html: contenido,
        };

        //usando el transporter del principio del docuemento enviamos el email con las opciones declaradas antes
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            }
            console.log("Email sent: " + info.response);
        });
        return true;

    }catch(err){
        console.log("Error");
        console.log(err);
        return false;
    }
}

const infoArte = async (req, res) => {
    const id = req.params.id;
    const imagen = await Imagen.findOne({
        where: {
            id: id
        }
    });
    res.render('infoArte', {
        nombreP: "InfoArte",
        pagina: "infoArte",
        user: req.session.user,
        userid: req.session.userId,
        imagen: imagen
    })
}

const perfil = async function (req, res) {
    const id = req.params.id;
    const usuario = await Usuario.findOne({
        where: {id: id}
    });
    let imagenes = await Imagen.findAll({
        where: {
            usuario: id
        }
    });
    res.render('perfil', {
        nombreP: "Perfil",
        pagina: "perfil",
        user: req.session.user,
        userid: req.session.userId,
        usuario: usuario,
        imagenes: imagenes

    })
}

const registro = async (req, res) => {
    res.render('registro', {
        nombreP: "Registro",
        pagina: "registro",
        errores: false,
        user: req.session.user,
        userid: req.session.userId
    })
}

const registrarse  = async (req, res) => {
    const { correo_registro, user_registro, password_registro, artesania_registro } = req.body;
    console.log(correo_registro, password_registro, artesania_registro, user_registro, password_registro);
    //creamos un array de errores que iremos rellenanod segun se pasen mal los datos
    const errores = [];
    if(correo_registro.trim()===''){
        errores.push({mensaje: "El correo es obligatorio"});
    }
    if(user_registro.trim()===''){
        errores.push({mensaje: "El usuario es obligatorio"});
    }
    if(password_registro.trim()===''){
        errores.push({mensaje: "La contraseña es obligatoria"});
    }
    if(artesania_registro.trim()===''){
        errores.push({mensaje: "La artesania es obligatoria"});
    }
    //si hay errores los devolvemos para que los muestre por la view en vez de realizar el registro
    if(errores.length>0){
        res.render('registro', {
            nombreP: "Registro",
            pagina: "registro",
            errores: errores,
            user: req.session.user,
            userid: req.session.userId
        })
    }else{
        try{
            const nuevouser = await Usuario.create({nombre: user_registro, contrasenia: password_registro, artesania: artesania_registro, email: correo_registro});
            errores.push({mensaje: "Usuario registrado, por favor inicie sesión"});
            res.render('registro', {
                nombreP: "Registro",
                pagina: "registro",
                errores: errores,
                user: req.session.user,
                userid: req.session.userId
            })
        }catch(e){
            return res.render('error', {
                nombreP: "Error",
                pagina: "Error",
                proceso: "Registro de usuario",
                errorDatos: e,
                user: req.session.user,
                userid: req.session.userId
            });
        }
    }
}

const login = async (req, res) => {
    const { nombreuser, contrauser } = req.body;

    try {
        let userlog = await Usuario.findOne({
            where: {
                nombre: nombreuser,
                contrasenia: contrauser
            }
        });

        if (!userlog) {
            return res.render('error', {
                nombreP: "Error",
                pagina: "Error",
                proceso: "Inicio de sesión",
                errorDatos: "Usuario o contraseña incorrectos",
                user: req.session.user,
                userid: req.session.userId
            });
        }

        //almacenamos en la sesion tanto el id del usuario registrado como el usuario entero
        req.session.userId = userlog.id;
        req.session.user = userlog;
        //obtenemos todo el arte de la base de datos excepto la subida por el usuario si la hay
        arteDisponible = await Imagen.findAll({
            where: {
                usuario: { [Op.ne]: req.session.userId },
            }
        });
        mercadosDisponibles = await Mercado.findAll();

        console.log("Id actual desde login:", req.session.userId);

        res.redirect('/');

    } catch (e) {
        console.error("Error en login:", e);
        return res.render('error', {
            nombreP: "Error",
            pagina: "Error",
            proceso: "Inicio de sesión",
            errorDatos: "Error en login:", e,
            user: req.session.user,
            userid: req.session.userId
        });
    }
};

const logout = async (req, res) => {
    console.log("userId actual " + req.session.userId);
    //Al cerrar la sesión, la destruimos
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Eliminada la sesion");
        res.redirect('/');
    });
}

//enviamos las funciones al router para asignarlas a sus respectivas rutas
export {
    paginaInicio,
    listaEventos,
    eventosDisp,
    paginaArte,
    infoEvento,
    apuntarse,
    anularEvento,
    infoArte,
    perfil,
    registro,
    registrarse,
    login,
    logout
}