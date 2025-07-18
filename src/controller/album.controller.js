const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

const albumCtl = {};

// Obtener todos los álbumes
albumCtl.obtenerAlbumes = async (req, res) => {
    try {
        const [listaAlbumes] = await sql.promise().query(`
            select * from albumes
        `);

        const albumesCompletos = await Promise.all(
            listaAlbumes.map(async (album) => {
                const albumMongo = await mongo.albumModel.findOne({ 
                    idAlbumSql: album.idAlbum 
                });
                return {
                    ...album,
                    detallesMongo: albumMongo
                };
            })
        );

        return res.apiResponse(albumesCompletos, 'Succes');
    } catch (error) {
        console.error('Error', error);
        return res.apiError('Error ');
    }
};

// Crear nuevo álbum
albumCtl.crearAlbum = async (req, res) => {
    try {
        const { tituloAlbum, artista, anoLanzamiento, enlace, genero, artistaIdArtista } = req.body;

        // Crear en SQL
        const datosSql = {
            tituloAlbum,
            artista,
            anoLanzamiento: parseInt(anoLanzamiento),
            estado: 'activo',
            createAlbum: new Date().toLocaleString(),
            artistaIdArtista
        };

        const nuevoAlbum = await orm.album.create(datosSql);
        const idAlbum = nuevoAlbum.idAlbum;

        // Crear en MongoDB
        const datosMongo = {
            enlace,
            genero,
            imagen: req.files?.imagen?.name || null,
            idAlbumSql: idAlbum,
            createAlbumMongo: new Date().toLocaleString()
        };

        await mongo.albumModel.create(datosMongo);

        return res.apiResponse(
            { idAlbum }, 
             
            'Succes'
        );

    } catch (error) {
        console.error('Error ', error);
        return res.apiError('Error ');
    }
};

module.exports = albumCtl;