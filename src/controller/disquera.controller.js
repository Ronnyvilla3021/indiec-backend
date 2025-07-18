const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos } = require('../lib/encrypDates');

const disqueraCtl = {};

// Obtener perfil de disquera
disqueraCtl.obtenerPerfilDisquera = async (req, res) => {
    try {
        const [perfilDisquera] = await sql.promise().query(`
            SELECT * FROM perfil_disqueras WHERE estado = 'activo' LIMIT 1
        `);

        if (perfilDisquera.length === 0) {
            return res.apiError('Error', 404);
        }

        const disqueraMongo = await mongo.perfilDisqueraModel.findOne({ 
            idDisqueraSql: perfilDisquera[0].idDisquera 
        });

        const perfilCompleto = {
            ...perfilDisquera[0],
            detallesMongo: disqueraMongo
        };

        return res.apiResponse(perfilCompleto, 200, 'Success');
    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error', 500);
    }
};

// Crear/Actualizar perfil de disquera
disqueraCtl.gestionarPerfilDisquera = async (req, res) => {
    try {
        const { nombreDisquera, correo, direccion, telefono, descripcion } = req.body;

        const [perfilExistente] = await sql.promise().query(
            'SELECT * FROM perfil_disqueras WHERE estado = "activo" LIMIT 1'
        );

        let idDisquera;

        if (perfilExistente.length > 0) {
            idDisquera = perfilExistente[0].idDisquera;
            await sql.promise().query(`
                UPDATE perfil_disqueras 
                SET nombreDisquera = ?, correo = ?, updateDisquera = ?
                WHERE idDisquera = ?
            `, [nombreDisquera, correo, new Date().toLocaleString(), idDisquera]);

            await mongo.perfilDisqueraModel.updateOne(
                { idDisqueraSql: idDisquera },
                {
                    direccion,
                    telefono: cifrarDatos(telefono),
                    descripcion,
                    fotoImagen: req.files?.fotoImagen?.name || null,
                    updateDisqueraMongo: new Date().toLocaleString()
                }
            );

            return res.apiResponse(null, 200, 'Success');
        } else {
            const datosSql = {
                nombreDisquera,
                correo,
                estado: 'activo',
                createDisquera: new Date().toLocaleString()
            };

            const nuevaDisquera = await orm.perfilDisquera.create(datosSql);
            idDisquera = nuevaDisquera.idDisquera;

            const datosMongo = {
                direccion,
                telefono: cifrarDatos(telefono),
                descripcion,
                fotoImagen: req.files?.fotoImagen?.name || null,
                idDisqueraSql: idDisquera,
                createDisqueraMongo: new Date().toLocaleString()
            };

            await mongo.perfilDisqueraModel.create(datosMongo);

            return res.apiResponse(
                { idDisquera }, 
                201, 
                'Success'
            );
        }

    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error', 500);
    }
};

// Obtener estadísticas generales
disqueraCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                (SELECT COUNT(*) FROM artistas WHERE estado = 'activo') as totalArtistas,
                (SELECT COUNT(*) FROM canciones WHERE estado = 'activo') as totalCanciones,
                (SELECT COUNT(*) FROM albumes WHERE estado = 'activo') as totalAlbumes,
                (SELECT COUNT(*) FROM eventos WHERE estado = 'activo') as totalEventos,
                (SELECT COUNT(*) FROM registro_ventas WHERE estado = 'activo') as totalVentas
        `);

        return res.apiResponse(estadisticas[0], 200, 'Success');
    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error', 500);
    }
};

module.exports = disqueraCtl;
