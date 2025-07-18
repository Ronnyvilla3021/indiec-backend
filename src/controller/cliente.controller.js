const clienteCtl = {};
const orm = require('../Database/dataBase.orm');
const sql = require('../Database/dataBase.sql');
const mongo = require('../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../lib/encrypDates');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
  try {
    return dato ? descifrarDatos(dato) : '';
  } catch (error) {
    console.error('Error', error);
    return '';
  }
};

// Mostrar todos los clientes con datos desencriptados
clienteCtl.mostrarClientes = async (req, res) => {
    try {
        const [listaClientes] = await sql.promise().query('SELECT * FROM clientes WHERE stadoCliente = "activo"');
        
        const clientesCompletos = await Promise.all(
            listaClientes.map(async (cliente) => {
                const clienteMongo = await mongo.clienteModel.findOne({ 
                    idClienteSql: cliente.idClientes 
                });

                return {
                    ...cliente,
                    cedulaCliente: descifrarSeguro(cliente.cedulaCliente),
                    nombreCliente: descifrarSeguro(cliente.nombreCliente),
                    usernameCliente: descifrarSeguro(cliente.usernameCliente),
                    detallesMongo: clienteMongo ? {
                        direccionCliente: descifrarSeguro(clienteMongo.direccionCliente),
                        telefonoCliente: descifrarSeguro(clienteMongo.telefonoCliente),
                        emailCliente: descifrarSeguro(clienteMongo.emailCliente),
                        tipoCliente: clienteMongo.tipoCliente
                    } : null
                };
            })
        );

        return res.json(clientesCompletos);
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Crear nuevo cliente con encriptación
clienteCtl.crearCliente = async (req, res) => {
    try {
        const { cedulaCliente, nombreCliente, usernameCliente, passwordCliente, 
                direccionCliente, telefonoCliente, emailCliente, tipoCliente } = req.body;

        if (!cedulaCliente || !nombreCliente || !usernameCliente || !passwordCliente) {
            return res.status(400).json({ message: 'Error' });
        }

        const nuevoCliente = await orm.cliente.create({
            cedulaCliente: cifrarDatos(cedulaCliente),
            nombreCliente: cifrarDatos(nombreCliente),
            usernameCliente: cifrarDatos(usernameCliente),
            passwordCliente: cifrarDatos(passwordCliente),
            stadoCliente: 'activo',
            createCliente: new Date().toLocaleString(),
        });

        if (direccionCliente || telefonoCliente || emailCliente) {
            await mongo.clienteModel.create({
                direccionCliente: cifrarDatos(direccionCliente || ''),
                telefonoCliente: cifrarDatos(telefonoCliente || ''),
                emailCliente: cifrarDatos(emailCliente || ''),
                tipoCliente: tipoCliente || 'Regular',
                idClienteSql: nuevoCliente.idClientes
            });
        }

        return res.status(201).json({ 
            message: 'Success',
            idCliente: nuevoCliente.idClientes
        });

    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ 
            message: 'Error', 
            error: error.message 
        });
    }
};

// Actualizar cliente con encriptación
clienteCtl.actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { cedulaCliente, nombreCliente, usernameCliente, 
                direccionCliente, telefonoCliente, emailCliente } = req.body;

        if (!cedulaCliente || !nombreCliente || !usernameCliente) {
            return res.status(400).json({ message: 'Error' });
        }

        await sql.promise().query(
            `UPDATE clientes SET 
                cedulaCliente = ?, 
                nombreCliente = ?, 
                usernameCliente = ?, 
                updateCliente = ? 
             WHERE idClientes = ?`,
            [
                cifrarDatos(cedulaCliente),
                cifrarDatos(nombreCliente),
                cifrarDatos(usernameCliente),
                new Date().toLocaleString(),
                id
            ]
        );

        if (direccionCliente || telefonoCliente || emailCliente) {
            await mongo.clienteModel.updateOne(
                { idClienteSql: id },
                {
                    $set: {
                        direccionCliente: cifrarDatos(direccionCliente || ''),
                        telefonoCliente: cifrarDatos(telefonoCliente || ''),
                        emailCliente: cifrarDatos(emailCliente || ''),
                    }
                }
            );
        }

        return res.json({ message: 'Success' });

    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

// Eliminar (desactivar) cliente
clienteCtl.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        await sql.promise().query(
            `UPDATE clientes SET 
                stadoCliente = 'inactivo', 
                updateCliente = ? 
             WHERE idClientes = ?`,
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Success' });
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({ message: 'Error', error: error.message });
    }
};

module.exports = clienteCtl;
