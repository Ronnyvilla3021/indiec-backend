const managerCtl = {};
const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error');
        return '';
    }
};

// Mostrar todos los managers
managerCtl.mostrarManagers = async (req, res) => {
    try {
        const [listaManagers] = await sql.promise().query('SELECT * FROM managers WHERE estado = "activo"');
        
        const managersCompletos = await Promise.all(
            listaManagers.map(async (manager) => {
                // Obtener datos adicionales de MongoDB
                const managerMongo = await mongo.managerMongo.findOne({ 
                    idManagerSql: manager.idManager 
                });

                return {
                    ...manager,
                    nombres: descifrarSeguro(manager.nombres),
                    apellidos: descifrarSeguro(manager.apellidos),
                    correo: descifrarSeguro(manager.correo),
                    detallesMongo: managerMongo || null
                };
            })
        );

        return res.json(managersCompletos);
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error al obtener los managers', error: error.message });
    }
};

// Crear nuevo manager con encriptación
managerCtl.crearManager = async (req, res) => {
    try {
        const { nombres, apellidos, correo, fechaNacimiento, genero, imagen } = req.body;

        // Validar que los campos requeridos no estén vacíos
        if (!nombres || !apellidos || !correo) {
            return res.status(400).json({ message: 'Nombres, apellidos y correo son requeridos' });
        }

        // Crear en SQL con datos encriptados
        const nuevoManager = await orm.manager.create({
            nombres: cifrarDatos(nombres),
            apellidos: cifrarDatos(apellidos),
            correo: cifrarDatos(correo),
            estado: 'activo',
            createManager: new Date().toLocaleString(),
        });

        // Crear en MongoDB con datos adicionales
        const managerMongo = {
            fechaNacimiento,
            genero,
            imagen,
            idManagerSql: nuevoManager.idManager,
            createManagerMongo: new Date().toLocaleString(),
        };

        await mongo.managerModel.create(managerMongo);

        return res.status(201).json({ 
            message: 'Success',
            idManager: nuevoManager.idManager
        });

    } catch (error) {
        console.error('Error');
        return res.status(500).json({ 
            message: 'Error al crear el manager', 
            error: error.message 
        });
    }
};

// Actualizar manager con encriptación
managerCtl.actualizarManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, correo, fechaNacimiento, genero, imagen } = req.body;

        // Validar que los campos requeridos no estén vacíos
        if (!nombres || !apellidos || !correo) {
            return res.status(400).json({ message: 'Nombres, apellidos y correo son requeridos' });
        }

        // Actualizar en SQL
        const [result] = await sql.promise().query(`
            UPDATE managers 
            SET nombres = ?, apellidos = ?, correo = ?, updateManager = ?
            WHERE idManager = ?
        `, [cifrarDatos(nombres), cifrarDatos(apellidos), cifrarDatos(correo), new Date().toLocaleString(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Manager no encontrado' });
        }

        // Actualizar en MongoDB
        await mongo.managerMongo.updateOne(
            { idManagerSql: id },
            {
                $set: {
                    fechaNacimiento,
                    genero,
                    imagen,
                    updateManagerMongo: new Date().toLocaleString(),
                }
            }
        );

        return res.json({ message: 'Success' });

    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error al actualizar el manager', error: error.message });
    }
};

// Eliminar (desactivar) manager
managerCtl.eliminarManager = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await sql.promise().query(`
            UPDATE managers 
            SET estado = 'inactivo', updateManager = ?
            WHERE idManager = ?
        `, [new Date().toLocaleString(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Manager no encontrado' });
        }

        return res.json({ message: 'Success' });
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error al desactivar el manager', error: error.message });
    }
};

module.exports = managerCtl;
