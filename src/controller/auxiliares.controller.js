const orm = require('../Database/dataBase.orm');
const auxiliaresCtl = {};

// Obtener todos los géneros
auxiliaresCtl.obtenerGeneros = async (req, res) => {
    try {
        const generos = await orm.genero.findAll({
            where: { estado: 'activo' },
            order: [['nombreGenero', 'ASC']]
        });
        return res.apiResponse(generos, 'Succes');
    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error');
    }
};

// Crear nuevo género
auxiliaresCtl.crearGenero = async (req, res) => {
    try {
        const { nombreGenero, descripcion } = req.body;
        
        const nuevoGenero = await orm.genero.create({
            nombreGenero,
            descripcion,
            estado: 'activo'
        });
        
        return res.apiResponse(nuevoGenero, 201, 'Género creado exitosamente');
    } catch (error) {
        console.error('Error');
        return res.apiError('Error');
    }
};



// Obtener todas las tallas
auxiliaresCtl.obtenerTallas = async (req, res) => {
    try {
        const tallas = await orm.talla.findAll({
            where: { estado: 'activo' },
            order: [['nombreTalla', 'ASC']]
        });
        return res.apiResponse(tallas,'Succes');
    } catch (error) {
        console.error('Error ', );
        return res.apiError('Error');
    }
};


// Inicializar datos básicos
auxiliaresCtl.inicializarDatos = async (req, res) => {
    try {
        // Crear géneros básicos
        const generosBásicos = [
            { nombreGenero: 'Pop', descripcion: 'Música popular', estado: 'activo' },
            { nombreGenero: 'Rock', descripcion: 'Música rock', estado: 'activo' },
            { nombreGenero: 'Reggaeton', descripcion: 'Música urbana', estado: 'activo' },
            { nombreGenero: 'Salsa', descripcion: 'Música tropical', estado: 'activo' },
            { nombreGenero: 'Balada', descripcion: 'Música romántica', estado: 'activo' },
            { nombreGenero: 'Hip Hop', descripcion: 'Música rap', estado: 'activo' }
        ];

        for (const genero of generosBásicos) {
            const [created] = await orm.genero.findOrCreate({
                where: { nombreGenero: genero.nombreGenero },
                defaults: genero
            });
        }

        

        // Crear tallas básicas
        const tallasBásicas = [
            { nombreTalla: 'XS', descripcion: 'Extra pequeña', estado: 'activo' },
            { nombreTalla: 'S', descripcion: 'Pequeña', estado: 'activo' },
            { nombreTalla: 'M', descripcion: 'Mediana', estado: 'activo' },
            { nombreTalla: 'L', descripcion: 'Grande', estado: 'activo' },
            { nombreTalla: 'XL', descripcion: 'Extra grande', estado: 'activo' },
            { nombreTalla: 'XXL', descripcion: 'Doble extra grande', estado: 'activo' }
        ];

        for (const talla of tallasBásicas) {
            await orm.talla.findOrCreate({
                where: { nombreTalla: talla.nombreTalla },
                defaults: talla
            });
        }

        
        

        return res.apiResponse(null, 200, 'Datos básicos inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar datos:', error);
        return res.apiError('Error al inicializar datos básicos', 500);
    }
};

module.exports = auxiliaresCtl;