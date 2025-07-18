const ropaCtl = {};
const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

function safeDecrypt(data) {
    try {
        return descifrarDatos(data);
    } catch (error) {
        console.error('Error');
        return ''; // Devolver una cadena vacía si ocurre un error
    }
}

// Mostrar toda la ropa
ropaCtl.mostrarRopa = async (req, res) => {
    try {
        const [listaRopa] = await sql.promise().query('SELECT * FROM ropas');
        return res.json(listaRopa);
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Crear nueva ropa
ropaCtl.crearRopa = async (req, res) => {
    try {
        const { nombre, artista, tipo, talla } = req.body;

        // Validar que los campos requeridos no estén vacíos
        if (!nombre || !artista || !tipo || !talla) {
            return res.status(400).json({ message: 'Error' });
        }

        const envioSQL = {
            nombre,
            artista,
            tipo,
            talla,
            estado : 'activo',
            createRopa: new Date().toLocaleString()
        };

        const nuevaRopa = await orm.ropa.create(envioSQL);
        return res.status(201).json({ message: 'Success', idRopa: nuevaRopa.idRopa });
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Actualizar ropa
ropaCtl.actualizarRopa = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, artista, tipo, talla } = req.body;

        // Validar que los campos requeridos no estén vacíos
        if (!nombre || !artista || !tipo || !talla) {
            return res.status(400).json({ message: 'Error' });
        }

        const [result] = await sql.promise().query(`
            UPDATE ropas 
            SET nombre = ?, artista = ?, tipo = ?, talla = ?, updateRopa = ?
            WHERE idRopa = ?
        `, [nombre, artista, tipo, talla, new Date().toLocaleString(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Error' });
        }

        return res.json({ message: 'Success' });
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Eliminar ropa (cambiar estado a inactivo)
ropaCtl.eliminarRopa = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await sql.promise().query(`
            UPDATE ropas 
            SET estado = 'inactivo', updateRopa = ?
            WHERE idRopa = ?
        `, [new Date().toLocaleString(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Error' });
        }

        return res.json({ message: 'Success' });
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

module.exports = ropaCtl;
