import moment from "moment";
import { Usuario } from "../models/usuarios.js";
import { Imagen } from "../models/imagenes.js";
import { Mercado } from "../models/mercados.js";
import {Mercado_Usuario} from "../models/mercados_usuarios.js";
import { Solicitud } from "../models/solicitudes.js";
import puppeteer, {ConsoleMessage} from "puppeteer";
import { promises as fs } from 'fs';
import path from "path";
import nodemailer from "nodemailer";
import {Op, where} from "sequelize";
import dotenv from "dotenv";
import multer from "multer";
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
        userid: req.session.userId,
        solicitudes: req.session.solicitudes
    });
};

const listaEventos = async (req, res) => {
    const pageSize = 5;
    const page = Number(req.params.page);
    let posts;
    let max=page;
    let maxPag = 1;
    if(req.session.userId) {
        if(req.session.user.rol=='admin'){
            posts = await Mercado.findAll({
                where: {
                    creador: req.session.userId
                },
                //con offset declaramos a partir de que registro empezamos a contar para no traer los que ya tenemos
                //con limit declaramos el número de registros que traemos, en este caso 5
                offset: (page - 1) * pageSize,
                limit: pageSize
            })

            max = await Mercado.count({
                where: {
                    creador: req.session.userId
                },
                //con offset declaramos a partir de que registro empezamos a contar para no traer los que ya tenemos
                //con limit declaramos el número de registros que traemos, en este caso 5
                offset: (page - 1) * pageSize,
                limit: pageSize
            })
        }else{
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
        }
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
            moment: moment,
            solicitudes: req.session.solicitudes
        });
}

const listaUsers = async (req, res) => {
    const pageSize = 5;
    const { page, mercadoId } = req.params;
    const mercado = await Mercado.findOne({where: {id: mercadoId}});
    let posts;
    let max=page;
    let maxPag = 1;
    if(req.session.userId) {
        posts = await Usuario.findAll({
            include: [{
                model: Mercado,
                where: {id: mercadoId}
            }],
            offset: (page - 1) * pageSize,
            limit: pageSize
        })
        max = await Usuario.count({
            include: [{
                model: Mercado,
                where: {id: mercadoId}
            }]
        })
        maxPag = Math.ceil(max/pageSize);
    } else {
        posts = null;
    }

    const prev = page === 1 ? undefined : page - 1;
    const next = page + 1;

    res.render('listaUsers',{
        nombreP: "Asistentes",
        pagina: "Asistentes",
        user: req.session.user,
        userid: req.session.userId,
        mercado: mercado,
        asistentes: posts,
        prev: prev,
        sig: next,
        page: page,
        max: maxPag,
        moment: moment,
        solicitudes: req.session.solicitudes
    })
}

const listaSolicitudes = (req, res) => {
    const pageSize = 5;
    const page = parseInt(req.params.page) || 1;

    if (!req.session.solicitudes) {
        // No hay solicitudes en sesión, devolver vacío o redirigir
        return res.render('listaSolicitudes', {
            nombreP: "Solicitudes",
            pagina: "Solicitudes",
            user: req.session.user,
            userid: req.session.userId,
            mercado: null,
            prev: undefined,
            sig: undefined,
            page: 1,
            max: 1,
            moment: moment,
            solicitudes: []
        });
    }

    const solicitudesTotales = req.session.solicitudes;
    const total = solicitudesTotales.length;
    const maxPag = Math.ceil(total / pageSize);

    // Limpiar page si está fuera de rango
    const currentPage = Math.min(Math.max(page, 1), maxPag);

    // Calcular índice de inicio y fin para el slice
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Obtener solo las solicitudes de la página actual
    const solicitudes = solicitudesTotales.slice(startIndex, endIndex);

    const prev = currentPage > 1 ? currentPage - 1 : undefined;
    const next = currentPage < maxPag ? currentPage + 1 : undefined;

    res.render('listaSolicitudes', {
        nombreP: "Solicitudes",
        pagina: "Solicitudes",
        user: req.session.user,
        userid: req.session.userId,
        mercado: null,
        prev: prev,
        sig: next,
        page: currentPage,
        max: maxPag,
        moment: moment,
        solicitudes: solicitudes
    });
};

const solicitud_aceptar = async (req, res) => {
    const acepto = req.params.acepto;
    const sol = await Solicitud.findOne({
        where: {id: req.params.solicitud}
    })
    if(acepto==0){
        await Solicitud.destroy({
            where: {id: req.params.solicitud}
        });
        const solictudesNew = await Solicitud.findAll({
            where: {usuario: req.session.userId},
            })
        req.session.solicitudes = solictudesNew;
        res.redirect('/listaEventos/1');
    }else if(acepto==1){
        res.redirect('/apuntarse/' + sol.mercado);
    }
}


const eventosDisp = async function (req, res) {
    const pageSize = 8;
    const page = Math.max(1, Number(req.params.page) || 1); // Asegurar mínimo 1
    let posts;
    let maxPag = 1;

    try {
        posts = await Mercado.findAll({
            offset: (page - 1) * pageSize,
            limit: pageSize
        });

        const max = await Mercado.count({});
        maxPag = Math.ceil(max / pageSize);

        const prev = page === 1 ? undefined : page - 1;
        const next = page >= maxPag ? undefined : page + 1; // Evitar páginas inexistentes

        res.render('eventos', {
            nombreP: "EventosDisponibles",
            pagina: "EventosDisponibles",
            user: req.session.user,
            userid: req.session.userId,
            mercados: posts,
            prev: prev,
            sig: next,
            page: page,
            max: maxPag,
            solicitudes: req.session.solicitudes
        });
    } catch (error) {
        console.error('Error en eventosDisp:', error);
        res.status(500).send('Error interno del servidor');
    }
}

const paginaArte  = async (req, res) => {
    const pageSize = 6;
    const page = Number(req.params.page);
    let posts;
    const filtro = req.query.filtro;
    let maxPag = 1;
    let max = page;
    if(req.session.userId) {
        if(filtro){
            switch (filtro){
                case "artesania":
                    arteDisponible = await Imagen.findAll({
                        where: {
                            //excluimos las imaenes que pertenezcan al usuario registrado
                            usuario: { [Op.ne]: req.session.userId },
                            artesania: req.query.buscador
                        },
                        offset: (page - 1) * pageSize,
                        limit: pageSize
                    });
                    max = await Imagen.count({
                        where: {
                            usuario: { [Op.ne]: req.session.userId },
                        }
                    });
                    break;
                case "artesano":
                    arteDisponible = await Imagen.findAll({
                        where: {
                            //excluimos las imaenes que pertenezcan al usuario registrado
                            usuario: { [Op.ne]: req.session.userId },
                            username: req.query.buscador
                        },
                        offset: (page - 1) * pageSize,
                        limit: pageSize
                    });
                    max = await Imagen.count({
                        where: {
                            usuario: { [Op.ne]: req.session.userId },
                        }
                    });
                    break;
            }
        }else{
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
        }

    }else{
        //si no hay ningun usuario con la sesion iniciada obtiene todas las imagenes
        if(filtro){
            switch (filtro) {
                case "artesania":
                    console.log("Has seleccionada artesania");
                    arteDisponible = await Imagen.findAll({
                        where: {
                            artesania: req.query.buscador
                        },
                        offset: (page - 1) * pageSize,
                        limit: pageSize
                    });
                    max = await Imagen.count({
                        where: {
                            artesania: req.query.buscador
                        },
                        offset: (page - 1) * pageSize,
                        limit: pageSize
                    });
                    break;
                case "artesano":
                    console.log("Has seleccionada artesano");
                    arteDisponible = await Imagen.findAll({
                        where: {
                            username: req.query.buscador
                        },
                        offset: (page - 1) * pageSize,
                        limit: pageSize
                    });
                    max = await Imagen.count({
                        where: {
                            username: req.query.buscador
                        },
                        offset: (page - 1) * pageSize,
                        limit: pageSize
                    });
                    break;
            }
        }else{
            arteDisponible = await Imagen.findAll({
                offset: (page - 1) * pageSize,
                limit: pageSize
            });
            max = await Imagen.count({
                offset: (page - 1) * pageSize,
                limit: pageSize
            });
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
        prev: prev,
        sig: next,
        page: page,
        max: maxPag,
        solicitudes: req.session.solicitudes,
        filtro: req.query.filtro || '',
        buscador: req.query.buscador || ''
    });
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
        clave_api: clave_api,
        solicitudes: req.session.solicitudes
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
        //En plantillMail se guarda la ruta el html de la plantilla para el pdf y el mail al apuntarse
        const plantillaMail = path.join(process.cwd(), 'views', 'plantillaPDF.html');
        //se lee el archivo y se guarda en contenidoMail
        let contenidoMail = await fs.readFile(plantillaMail, 'utf8');
        //las variables que habiamos puesto en la plantilla la sustituimos ahora por la info correspondiente
        console.log("url imagen " + mercadoNuevo.imagen);
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

        if(req.session.solicitudes){
            req.session.solicitudes = req.session.solicitudes.filter(s => s.mercado != mercado);
            await Solicitud.destroy({ where: { mercado: mercado, usuario: usuario } });

            const solicitudes = await Solicitud.findAll({ where: { usuario: usuario } });
            req.session.solicitudes = solicitudes;
        }

// ⚠️ Aquí guardas la sesión antes de generar el PDF
        req.session.save(async (err) => {
            if (err) {
                console.error('Error guardando sesión:', err);
                return res.status(500).send('Error guardando sesión');
            }

            try {
                const browser = await puppeteer.launch({
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                const page = await browser.newPage();
                await page.setContent(contenidoMail, { waitUntil: 'networkidle0' });
                const buffer = await page.pdf({ format: 'A5', printBackground: true });
                await browser.close();

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');
                res.end(buffer);
            } catch (err) {
                console.error(err);
                res.status(500).send('Error generando el PDF');
            }
        });


    }catch(err){
        console.log(err);
        return res.render('error', {
            nombreP: "Error",
            pagina: "Error",
            proceso: "Reserva de stand en evento",
            errorDatos: err,
            user: req.session.user,
            userid: req.session.userId,
            solicitudes: req.session.solicitudes
        });
    }
}

const anularEvento = async (req, res) => {
    let mercado;
    let usuarioid;
    let usuario;
    if(req.session.user.rol!="admin"){
        mercado= req.params.id;
        usuarioid= req.session.userId;
        usuario = req.session.user;
    }else{
        mercado= req.params.mercadoid;
        usuarioid= req.params.usuarioid;
        usuario = await Usuario.findOne({where: {id: usuarioid}});
    }
    try{
        await Mercado_Usuario.destroy({where: {
            mercadoId: mercado,
                usuarioId: usuarioid
        }});
        const mercadoAnulado = await Mercado.findOne({where: {id: mercado }});
        await Mercado.update({capacidad: (mercadoAnulado.capacidad+1)}, {where: {id: mercado}});

        const plantillaMail = path.join(process.cwd(), 'views', 'plantillaEmail.html');
        let contenidoMail = await fs.readFile(plantillaMail, 'utf8');
        contenidoMail = contenidoMail.replace('{{ARTESANO}}', usuario.nombre);
        contenidoMail = contenidoMail.replace('{{EVENTO}}', mercadoAnulado.nombre);
        contenidoMail = contenidoMail.replace('{{EVENTO}}', mercadoAnulado.nombre);

        const enviado = await enviaMail(usuario.email,'Anulación de evento',contenidoMail);

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
                userid: req.session.userId,
                solicitudes: req.session.solicitudes
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
            userid: req.session.userId,
            solicitudes: req.session.solicitudes
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
                console.log("Error al enviar email:", error);
                return;
            }
            console.log("Email enviado: " + info.response);
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
    const userImagen = await Usuario.findOne({
        where: {
            id: imagen.usuario
        }
    });
    res.render('infoArte', {
        nombreP: "InfoArte",
        pagina: "infoArte",
        user: req.session.user,
        userid: req.session.userId,
        imagen: imagen,
        userImagen: userImagen,
        solicitudes: req.session.solicitudes
    })
}

const perfil = async function (req, res) {
    const id = req.params.id;
    let miPerfil = false;
    if(id == req.session.userId){
        miPerfil = true;
    }
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
        imagenes: imagenes,
        miperfil: miPerfil,
        solicitudes: req.session.solicitudes

    })
}

const formSolicitud = async function (req, res) {
    const id = req.params.id;
    const usuario = await Usuario.findOne({
        where: {id: id}
    });
    const mercados = await Mercado.findAll({
        where: {creador: req.session.userId}
    })
    if(mercados.length>0){
        res.render('solicitud', {
            nombreP: "Solicitud",
            pagina: "solicitud",
            user: req.session.user,
            userid: req.session.userId,
            usuario: usuario,
            mercados: mercados,
            errores: null,
            solicitudes: req.session.solicitudes
        })

    }else {
        return res.render('error', {
            nombreP: "Error",
            pagina: "Error",
            proceso: "Solicitud de artesano",
            errorDatos: "No has creado ningún evento al que solicitar la participación de un artesano, puedes crear un evento desde la pestaña Mis eventos",
            user: req.session.user,
            userid: req.session.userId,
            solicitudes: req.session.solicitudes
        });
    }
}

const mandaSoli = async function (req, res) {
    const { mercado, artesano } = req.body;
    const errores = [];
    const usuario = await Usuario.findOne({
        where: {id: artesano}
    });
    const mercados = await Mercado.findAll({
        where: {creador: req.session.userId}
    });

    const nombremercado = await Mercado.findOne({
        where: {id: mercado}
    });

    console.log("Valores recibidos:", { mercado, artesano });

    const apuntado = await Mercado_Usuario.findOne({
        where: {
            usuarioId: artesano,
            mercadoId: mercado
        }
    });

    if (apuntado) {
        errores.push({mensaje: "El usuario ya participa en este evento"});
        res.render('solicitud', {
            nombreP: "Solicitud",
            pagina: "solicitud",
            user: req.session.user,
            userid: req.session.userId,
            usuario: usuario,
            mercados: mercados,
            errores: errores,
            solicitudes: req.session.solicitudes
        })
    } else {
        Solicitud.create({
            usuario: artesano,
            mercado: mercado,
            nombremercado: nombremercado.nombre,
            respuesta: 0
        });

        res.redirect('/listaEventos/1');
    }

}

const registro = async (req, res) => {
    res.render('registro', {
        nombreP: "Registro",
        pagina: "registro",
        errores: false,
        user: req.session.user,
        userid: req.session.userId,
        solicitudes: req.session.solicitudes
    })
}

const formImg = async (req, res) => {
    res.render('formImg', {
        nombreP: "formulario imagen",
        pagina: "formImg",
        errores: false,
        user: req.session.user,
        userid: req.session.userId,
        solicitudes: req.session.solicitudes
    })
}

const formPefil = async (req, res) => {
    res.render('nuevoPerfil', {
        nombreP: "nuevo perfil",
        pagina: "nuevoPerfil",
        errores: false,
        user: req.session.user,
        userid: req.session.userId,
        solicitudes: req.session.solicitudes
    })
}

const nuevoEvento = async (req, res) => {
    res.render('nuevoEvento', {
        edit: null,
        nombreP: "nuevo evento",
        pagina: "nuevoEvento",
        errores: false,
        user: req.session.user,
        userid: req.session.userId,
        solicitudes: req.session.solicitudes
    })
}

const editarEvento = async (req, res) => {
    const mercadoId = req.params.id;
    const mercado = await Mercado.findOne({
        where: {id: mercadoId}
    });
    res.render('nuevoEvento', {
        edit: mercado,
        mercadoId: mercadoId,
        nombreP: "nuevo evento",
        pagina: "nuevoEvento",
        errores: false,
        user: req.session.user,
        userid: req.session.userId,
        solicitudes: req.session.solicitudes
    })
}

const subeFoto = async (req, res) => {
    const usuario = req.session.userId;
    const user = req.session.user;
    const { titulo, descripcion, tipo } = req.body;
    const imagen = req.file;

    try {
        const nuevaImg = await Imagen.create({
            usuario: usuario,
            titulo: titulo,
            artesania: tipo,
            desc: descripcion,
            nombreimg: imagen.filename,
            username: user.nombre
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Error al crear la imagen");
    }

    res.redirect(`/perfil/${usuario}`);

}

const subePerfil = async (req, res) => {
    const usuario = req.session.userId;
    const user = req.session.user;
    const imagen = req.file;


    if(user.fotoPerfil!="profile.png"){
        const rutaAntigua = path.join('upload/perfiles', user.fotoPerfil);
        try {
            await fs.access(rutaAntigua); // Verifica si existe
            await fs.unlink(rutaAntigua); // Lo borra
            console.log('Imagen anterior eliminada:', user.fotoPerfil);
        } catch (err) {
            // El archivo no existe o no se puede borrar
            console.log('No se pudo eliminar la imagen anterior:', err.message);
        }
    }

    try {
        await Usuario.update(
            {fotoPerfil: imagen.filename},
            {where: {id: usuario}},
        )
        req.session.user.fotoPerfil = imagen.filename;
    } catch (error) {
        console.log(error);
        res.status(500).send("Error al actualizar el perfil");
    }

    res.redirect(`/perfil/${usuario}`);

}

const creaEvento = async (req, res) => {
    const usuario = req.session.userId;
    const user = req.session.user;
    let edit = null;
    const { titulo, desc, capacidad, fecha, sitio, ubi, Aeditar } = req.body;

    const hoy = moment().format('YYYY-MM-DD');
    const errores = [];
    if(fecha <= hoy){
        errores.push({mensaje: "La fecha que ha seleccionado antes ya ha pasado, elija otra"});
    }

    if(errores.length>0){
        if(Aeditar=="no") {
            const imagen = req.file;
            const rutafoto = path.join('upload/foto-eventos', imagen.filename);
            try{
                await fs.access(rutafoto);
                await fs.unlink(rutafoto);
            }catch(err){
                console.log(err);
            }
        } else {
            edit = await Mercado.findOne({
                where: {id: Aeditar}
            });
        }
        res.render('nuevoEvento', {
            edit: edit,
            nombreP: "nuevo evento",
            pagina: "nuevoEvento",
            errores: errores,
            user: req.session.user,
            userid: req.session.userId,
            solicitudes: req.session.solicitudes
        })
    } else {
        if(Aeditar=="no"){
            const imagen = req.file;
            const nuevoMercado = await Mercado.create({
                nombre: titulo,
                fecha: fecha,
                ubicacion: sitio,
                ubi_param: ubi,
                descripcion: desc,
                capacidad: capacidad,
                creador: usuario,
                imagen: imagen.filename
            })
        }else{
            await Mercado.update(
                {
                    nombre: titulo,
                    fecha: fecha,
                    ubicacion: sitio,
                    ubi_param: ubi,
                    descripcion: desc,
                    capacidad: capacidad,},
                {
                    where: { id: Aeditar }
                }
            );

        }
        res.redirect(`/listaEventos/`+1);
    }

}

const registrarse  = async (req, res) => {
    const { correo_registro, user_registro, password_registro, artesania_registro } = req.body;
    let rol;
    if(!req.session.user || req.session.user.rol !== "admin"){
        rol = "user";
    }else{
        rol = "admin";
    }

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
            userid: req.session.userId,
            solicitudes: req.session.solicitudes
        })
    }else{
        try{
            const nuevouser = await Usuario.create({nombre: user_registro, contrasenia: password_registro, artesania: artesania_registro, email: correo_registro, rol: rol});
            errores.push({mensaje: "Usuario registrado, por favor inicie sesión"});
            res.render('registro', {
                nombreP: "Registro",
                pagina: "registro",
                errores: errores,
                user: req.session.user,
                userid: req.session.userId,
                solicitudes: req.session.solicitudes
            })
        }catch(e){
            return res.render('error', {
                nombreP: "Error",
                pagina: "Error",
                proceso: "Registro de usuario",
                errorDatos: e,
                user: req.session.user,
                userid: req.session.userId,
                solicitudes: req.session.solicitudes
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
                userid: req.session.userId,
                solicitudes: req.session.solicitudes
            });
        }

        const solicitudes = await Solicitud.findAll({
            where: {
                usuario: userlog.id
            }
        });

        //almacenamos en la sesion tanto el id del usuario registrado como el usuario entero
        req.session.userId = userlog.id;
        req.session.user = userlog;
        req.session.solicitudes = solicitudes;

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
            userid: req.session.userId,
            solicitudes: req.session.solicitudes
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
    listaUsers,
    listaSolicitudes,
    eventosDisp,
    paginaArte,
    infoEvento,
    apuntarse,
    anularEvento,
    infoArte,
    perfil,
    registro,
    formImg,
    formPefil,
    nuevoEvento,
    editarEvento,
    registrarse,
    login,
    logout,
    subeFoto,
    subePerfil,
    creaEvento,
    formSolicitud,
    mandaSoli,
    solicitud_aceptar
}