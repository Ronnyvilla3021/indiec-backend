const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

const ventasCtl = {};

// Registrar nueva venta
ventasCtl.registrarVenta = async (req, res) => {
    try {
        const { productoNombre, tipoProducto, cantidad, precioUnitario } = req.body;

        // Crear en SQL
        const datosSql = {
            productoNombre,
            tipoProducto,
            fecha: new Date(),
            cantidad: parseInt(cantidad),
            estado: 'activo',
            createVenta: new Date().toLocaleString()
        };

        const nuevaVenta = await orm.registroVentas.create(datosSql);
        const idVenta = nuevaVenta.idVenta;

        // Aquí podrías crear registros adicionales en MongoDB si necesitas
        // información no relacional sobre la venta

        return res.apiResponse(
            { idVenta, total: cantidad * precioUnitario }, 
            201, 
            'Success'
        );

    } catch (error) {
        console.error('Error');
        return res.apiError('Error', 500);
    }
};

// Obtener reporte de ventas
ventasCtl.obtenerReporteVentas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let query = `
            SELECT rv.*, 
                   DATE_FORMAT(rv.fecha, '%Y-%m-%d') as fechaFormateada,
                   MONTH(rv.fecha) as mes,
                   YEAR(rv.fecha) as año
            FROM registro_ventas rv 
            WHERE rv.estado = 'activo'
        `;

        const params = [];

        if (fechaInicio && fechaFin) {
            query += ` AND rv.fecha BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        query += ` ORDER BY rv.fecha DESC`;

        const [ventas] = await sql.promise().query(query, params);

        // Calcular estadísticas
        const totalVentas = ventas.reduce((sum, venta) => sum + venta.cantidad, 0);
        const tiposProducto = [...new Set(ventas.map(v => v.tipoProducto))];

        const estadisticas = {
            totalRegistros: ventas.length,
            totalVentas,
            tiposProducto,
            ventasPorTipo: tiposProducto.map(tipo => ({
                tipo,
                cantidad: ventas.filter(v => v.tipoProducto === tipo)
                              .reduce((sum, v) => sum + v.cantidad, 0)
            }))
        };

        return res.apiResponse({
            ventas,
            estadisticas
        }, 200, 'Success');

    } catch (error) {
        console.error('Error');
        return res.apiError('Error', 500);
    }
};

module.exports = ventasCtl;
