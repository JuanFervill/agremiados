import express from 'express';
import {upload} from "../config/multerConfig.js";
import {upload2, upload3} from "../config/multer2.js";
import { paginaInicio, listaEventos, eventosDisp, paginaArte, infoEvento, infoArte, perfil, registro, registrarse, login, logout, apuntarse, anularEvento, formImg, formPefil, subeFoto, subePerfil, nuevoEvento, creaEvento, listaUsers, editarEvento, formSolicitud, mandaSoli, listaSolicitudes, solicitud_aceptar } from '../controllers/paginaController.js';

const router = express.Router();

router.get('/', paginaInicio);
router.get('/listaUsers/:page/:mercadoId', listaUsers);
router.get('/listaEventos/:page', listaEventos);
router.post('/listaEventos/:page', listaEventos);
router.get('/eventosDisp/:page', eventosDisp);
router.get('/arte/:page', paginaArte);
router.get('/info-evento/:id', infoEvento);
router.get('/info-arte/:id', infoArte);
router.get('/perfil/:id', perfil);
router.get('/editar/:id', editarEvento);
router.get('/registro', registro);
router.get('/logout', logout);
router.post('/registrarse', registrarse);
router.post('/subeFoto', upload.single("imagen"), subeFoto);
router.post('/subePerfil', upload2.single("imagenp"), subePerfil);
router.post('/creaEvento', upload3.single("imagen"), creaEvento);
router.post('/loggearse', login);
router.get('/apuntarse/:id', apuntarse);
router.get('/anula-evento/:id', anularEvento);
router.get('/anula-user/:mercadoid/:usuarioid', anularEvento);
router.get('/formularioImagen', formImg);
router.get('/formularioPerfil', formPefil);
router.get('/nuevoevento', nuevoEvento);
router.get('/formularioSolicitud/:id', formSolicitud);
router.post('/mandaSoli', mandaSoli);
router.get('/listaSolicitudes/:page', listaSolicitudes)
router.get('/solicitud_aceptar/:solicitud/:acepto', solicitud_aceptar);

export default router;