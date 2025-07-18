const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

const eventoCtl = {};

// Obtener todos los eventos
eventoCtl.obtenerEventos = async (req, res) => {
    try {
        const [listaEventos] = await sql.promise().query(`
            SELECT * FROM eventos WHERE estado = 'activo' ORDER BY fecha DESC
        `);

        const eventosCompletos = await Promise.all(
            listaEventos.map(async (evento) => {
                const eventoMongo = await mongo.eventoModel.findOne({ 
                    idEventoSql: evento.idEvento 
                });
                return {
                    ...evento,
                    detallesMongo: eventoMongo
                };
            })
        );

        return res.apiResponse(eventosCompletos, 200, 'Success');
    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error', 500);
    }
};

// Crear nuevo evento
eventoCtl.crearEvento = async (req, res) => {
    try {
        const { nombreEvento, ubicacion, fecha, generoMusical, contacto, capacidad, descripcion } = req.body;

        const datosSql = {
            nombreEvento,
            ubicacion,
            fecha: new Date(fecha),
            generoMusical,
            estado: 'activo',
            createEvento: new Date().toLocaleString()
        };

        const nuevoEvento = await orm.evento.create(datosSql);
        const idEvento = nuevoEvento.idEvento;

        const datosMongo = {
            contacto,
            capacidad: parseInt(capacidad),
            descripcion,
            imagen: req.files?.imagen?.name || null,
            idEventoSql: idEvento,
            createEventoMongo: new Date().toLocaleString()
        };

        await mongo.eventoModel.create(datosMongo);

        return res.apiResponse(
            { idEvento }, 
            201, 
            'Success'
        );

    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error', 500);
    }
};

module.exports = eventoCtl;
