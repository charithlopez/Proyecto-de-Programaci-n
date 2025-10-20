
const express = require('express');
const cors = require('cors');
const conection = require('./base'); 
const app = express();
const port = 3000;

app.use(cors());

app.use(express.json());

app.get('/cotizador', (req, res) => {
    conection.query('SELECT * FROM cotizador', (err, results) => {
        if (err) {
            console.error('Error al obtener los materiales:', err);
            return res.status(500).send('Error al obtener los materiales');
        }
        res.json(results); 
    });
});

app.post('/agregar-material', (req, res) => {
    const { nombre, unidad, precio } = req.body;
    const query = 'INSERT INTO cotizador (Nombre, Unidad, Precio) VALUES (?, ?, ?)';
    
    conection.query(query, [nombre, unidad, precio], (err, result) => {
        if (err) {
            console.error('Error al insertar el material:', err);
            return res.status(500).json({ error: 'Error al insertar el material' });
        }
        res.status(200).json({ message: 'Material insertado correctamente', result });
    });
});


app.post('/finalizar-cotizacion', (req, res) => {
    const { materiales, total } = req.body;

    if (!materiales || materiales.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron materiales' });
    }


    const insertCotizacion = 'INSERT INTO cotizaciones (fecha, total) VALUES (NOW(), ?)';
    conection.query(insertCotizacion, [total], (err, result) => {
        if (err) {
            console.error('Error al insertar cotización:', err);
            return res.status(500).json({ error: 'Error al guardar cotización', details: err });
        }

        const idCotizacion = result.insertId; 
        const insertDetalles = 'INSERT INTO detalles_cotizacion (id_cotizacion, nombre_material, cantidad, precio_unitario) VALUES ?';

        const detallesValores = materiales.map(mat => [
            idCotizacion,
            mat.nombre,
            mat.cantidad,
            mat.precioUnitario
        ]);
        conection.query(insertDetalles, [detallesValores], (err2, result2) => {
            if (err2) {
                console.error('Error al insertar detalles:', err2);
                return res.status(500).json({ error: 'Error al guardar detalles', details: err2 });
            }

            res.status(200).json({ message: 'Cotización guardada correctamente' });
        });
    });
});


app.get('/registro-completo', (req, res) => {
    const query = `
        SELECT 
            c.id AS id_cotizacion,
            c.fecha,
            dc.nombre_material,
            dc.cantidad,
            dc.precio_unitario,
            (dc.cantidad * dc.precio_unitario) AS valor_total
        FROM cotizaciones c
        JOIN detalles_cotizacion dc ON c.id = dc.id_cotizacion
        ORDER BY c.id DESC
    `;
    conection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener cotizaciones completas:', err);
            return res.status(500).send('Error al obtener cotizaciones completas');
        }
        res.json(results);
    });
});

app.get('/facturacion/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT 
            c.id AS id_cotizacion,
            dc.nombre_material,
            dc.cantidad,
            dc.precio_unitario,
            (dc.cantidad * dc.precio_unitario) AS precio_total,
            m.IDmaterial,
            m.Unidad,
            c.fecha
        FROM cotizaciones c
        JOIN detalles_cotizacion dc ON c.id = dc.id_cotizacion
        LEFT JOIN cotizador m ON m.Nombre = dc.nombre_material
        WHERE c.id = ?
    `;
    conection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener la factura:', err);
            return res.status(500).send('Error al obtener la factura');
        }
        res.json(results);
    });
});


app.get('/estadisticas-materiales', (req, res) => {
    const query = `
        SELECT nombre_material, SUM(cantidad) AS total_cantidad
        FROM detalles_cotizacion
        GROUP BY nombre_material
        ORDER BY total_cantidad DESC
    `;
    conection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err);
            return res.status(500).send('Error al obtener estadísticas');
        }
        res.json(results);
    });
});

app.put('/actualizar-material/:id', (req, res) => {
    const id = req.params.id;
    let { nombre, unidad, precio } = req.body;

    if (!nombre || !unidad || !precio) {
        return res.status(400).json({ error: 'Faltan datos del material' });
    }

    precio = parseFloat(precio);
    if (isNaN(precio)) {
        return res.status(400).json({ error: 'El precio debe ser un número' });
    }

    const query = 'UPDATE cotizador SET Nombre = ?, Unidad = ?, Precio = ? WHERE IDmaterial = ?';
    conection.query(query, [nombre, unidad, precio, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar el material:', err);
            return res.status(500).json({ error: 'Error al actualizar el material' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Material no encontrado' });
        }
        res.status(200).json({ message: 'Material actualizado correctamente' });
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
