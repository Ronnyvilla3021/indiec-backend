const paginaCtl = {};
const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

function safeDecrypt(data) {
    try {
        return descifrarDatos(data);
    } catch (error) {
        console.error('Error');
        return ''; // Devolver cadena vacía si falla descifrar
    }
}

paginaCtl.mostrarPagina = async (req, res) => {
    try {
        const [listaPagina] = await sql.promise().query('SELECT * FROM pages');
        if (!listaPagina.length) {
            return res.status(404).json({ message: 'No se encontraron páginas' });
        }

        const pagina = await mongo.pageModel.findOne({ idPageSql: listaPagina[0].idPage });
        const paginas = listaPagina[0];

        return res.json({ paginas, pagina });
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error al obtener la página', error: error.message });
    }
};

paginaCtl.mandarPagina = async (req, res) => {
    try {
        const { namePage, description, statePage, visionPage, misionPage, celularPage, correoPagina } = req.body;

        const envioSQL = {
            namePage,
            description,
            statePage,
            createPage: new Date().toLocaleString(),
        };

        const envioPage = await orm.pagina.create(envioSQL);
        const idPagina = envioPage.insertId || envioPage.idPage || envioPage.id; // Ajusta según respuesta ORM

        const envioMongo = {
            visionPage,
            misionPage,
            celularPage,
            correoPagina,
            idPageSql: idPagina,
            createPageMongo: new Date().toLocaleString(),
        };

        await mongo.pageModel.create(envioMongo);

        // Si usas flash en un framework (ejemplo express-flash), asegúrate que está instalado y configurado
        if (res.flash) {
            res.flash('success', 'Éxito al guardar');
        }
        return res.json({ message: 'Success' });
    } catch (error) {
        console.error('Error');
        return res.status(500).json({ message: 'Error al guardar la página', error: error.message });
    }
};

module.exports = paginaCtl;
