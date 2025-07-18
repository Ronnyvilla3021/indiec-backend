const grupoMusicalCtl = {};
const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');

// Mostrar todos los grupos musicales
grupoMusicalCtl.mostrarGrupos = async (req, res) => {
    try {
        const [listaGrupos] = await sql.promise().query('SELECT * FROM grupos_musicales WHERE estado = "activo"');
        
        const gruposCompletos = await Promise.all(
            listaGrupos.map(async (grupo) => {
                const grupoMongo = await mongo.grupoMusical.findOne({ 
                    idGrupoSql: grupo.idGrupo 
                });

                return {
                    ...grupo,
                    detallesMongo: grupoMongo || null
                };
            })
        );

        return res.json(gruposCompletos);
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Crear nuevo grupo musical
grupoMusicalCtl.crearGrupo = async (req, res) => {
    try { 
        const { nombreGrupo, generoMusical, plataforma, descripcion, imagen } = req.body;

        if (!nombreGrupo) {
            return res.status(400).json({ message: 'Error' });
        }

        const nuevoGrupo = await orm.grupoMusical.create({
            nombreGrupo,
            estado: 'activo',
            createGrupo: new Date().toLocaleString(),
        });

        const grupoMongo = {
            generoMusical,
            plataforma,
            descripcion,
            imagen,
            idGrupoSql: nuevoGrupo.idGrupo,
            createGrupoMongo: new Date().toLocaleString(),
        };

        await mongo.grupoMusical.create(grupoMongo);

        return res.status(201).json({ 
            message: 'Success',
            idGrupo: nuevoGrupo.idGrupo
        });

    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ 
            message: 'Error', 
            error: error.message 
        });
    }
};

// Actualizar grupo musical
grupoMusicalCtl.actualizarGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreGrupo, generoMusical, plataforma, descripcion, imagen } = req.body;

        if (!nombreGrupo) {
            return res.status(400).json({ message: 'Error' });
        }

        const [result] = await sql.promise().query(`
            UPDATE grupos_musicales 
            SET nombreGrupo = ?, updateGrupo = ?
            WHERE idGrupo = ?
        `, [nombreGrupo, new Date().toLocaleString(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Error' });
        }

        await mongo.grupoMusical.updateOne(
            { idGrupoSql: id },
            {
                $set: {
                    generoMusical,
                    plataforma,
                    descripcion,
                    imagen,
                    updateGrupoMongo: new Date().toLocaleString(),
                }
            }
        );

        return res.json({ message: 'Success' });

    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Eliminar (desactivar) grupo musical
grupoMusicalCtl.eliminarGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await sql.promise().query(`
            UPDATE grupos_musicales 
            SET estado = 'inactivo', updateGrupo = ?
            WHERE idGrupo = ?
        `, [new Date().toLocaleString(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Error' });
        }

        return res.json({ message: 'Success' });
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

module.exports = grupoMusicalCtl;
