import express from 'express';
import { paginaInicio, listaEventos, eventosDisp, paginaArte, infoEvento, infoArte, perfil, registro, registrarse, login, logout, apuntarse, anularEvento } from '../controllers/paginaController.js';

const router = express.Router();

router.get('/', paginaInicio);
router.get('/listaEventos/:page', listaEventos);
router.post('/listaEventos/:page', listaEventos);
router.get('/eventosDisp/:page', eventosDisp);
router.get('/arte/:page', paginaArte);
router.get('/info-evento/:id', infoEvento);
router.get('/info-arte/:id', infoArte);
router.get('/perfil/:id', perfil);
router.get('/registro', registro);
router.get('/logout', logout);
router.post('/registrarse', registrarse);
router.post('/loggearse', login);
router.get('/apuntarse/:id', apuntarse);
router.get('/anula-evento/:id', anularEvento);

export default router;