//importaciones
const express = require('express');
const cors = require('cors');
const conection = require('./base'); 
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


// Listar materiales
app.get('/cotizador', (req, res) => {
    conection.query('SELECT * FROM cotizador', (err, results) => {
        if (err) return res.status(500).send('Error al obtener materiales');
        res.json(results);
    });
});

// Agregar material
app.post('/agregar-material', (req, res) => {
    const { nombre, unidad, precio } = req.body;
    const sql = 'INSERT INTO cotizador (Nombre, Unidad, Precio) VALUES (?, ?, ?)';

    conection.query(sql, [nombre, unidad, precio], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al insertar material' });
        res.json({ message: 'Material agregado correctamente' });
    });
});

//editar material
app.put('/cotizador/:id', (req, res) => {
    const { nombre, unidad, precio } = req.body;
    const id = req.params.id;

    if (!nombre || !unidad || !precio) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const sql = `
        UPDATE cotizador 
        SET Nombre = ?, Unidad = ?, Precio = ? 
        WHERE IDmaterial = ?
    `;

    conection.query(sql, [nombre, unidad, precio, id], (err) => {
        if (err) {
            console.error("Error al actualizar material:", err);
            return res.status(500).json({ error: "Error al actualizar material" });
        }
        res.json({ message: "Material actualizado correctamente" });
    });
});



//finalizar cotizacion
app.post('/finalizar-cotizacion', (req, res) => {
    const { materiales, total, cc_cliente } = req.body;

    if (!materiales || materiales.length === 0)
        return res.status(400).json({ error: 'No se enviaron materiales' });

    const sqlCot = "INSERT INTO cotizaciones (cc_cliente, fecha, total) VALUES (?, NOW(), ?)";
    conection.query(sqlCot, [cc_cliente, total], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al insertar cotización" });

        const idCot = result.insertId;

        const sqlDet = "INSERT INTO detalles_cotizacion (id_cotizacion, nombre_material, cantidad, precio_unitario) VALUES ?";
        const values = materiales.map(m => [idCot, m.nombre, m.cantidad, m.precioUnitario]);

        conection.query(sqlDet, [values], (err2) => {
            if (err2) return res.status(500).json({ error: "Error al insertar detalles" });
            res.json({ message: "Cotización guardada correctamente" });
        });
    });
});

//registro
app.get('/registro-completo', (req, res) => {
    const sql = `
        SELECT 
            c.id AS id_cotizacion,
            c.cc_cliente,
            c.fecha,
            dc.nombre_material,
            dc.cantidad,
            dc.precio_unitario,
            (dc.cantidad * dc.precio_unitario) AS valor_total
        FROM cotizaciones c
        JOIN detalles_cotizacion dc ON c.id = dc.id_cotizacion
        ORDER BY c.id DESC;
    `;

    conection.query(sql, (err, results) => {
        if (err) return res.status(500).send("Error en registro completo");
        res.json(results);
    });
});

//facturacion
app.get('/facturacion/:id', (req, res) => {
    const id = req.params.id;

    const sql = `
        SELECT 
            c.id,
            c.cc_cliente,
            c.fecha,
            dc.nombre_material,
            dc.cantidad,
            dc.precio_unitario,
            cot.IDmaterial,
            cot.Unidad
        FROM cotizaciones c
        JOIN detalles_cotizacion dc ON c.id = dc.id_cotizacion
        LEFT JOIN cotizador cot ON cot.Nombre = dc.nombre_material
        WHERE c.id = ?;
    `;

    conection.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send("Error al obtener factura");
        res.json(results);
    });
});


//estadisticas
app.get('/estadisticas-materiales', (req, res) => {
    const sql = `
        SELECT nombre_material, SUM(cantidad) AS total_cantidad
        FROM detalles_cotizacion
        GROUP BY nombre_material
        ORDER BY total_cantidad DESC;
    `;

    conection.query(sql, (err, results) => {
        if (err) return res.status(500).send("Error estadísticas");
        res.json(results);
    });
});


//clientes y proveedores
app.get('/clientes', (req, res) => {
    conection.query('SELECT * FROM clientes', (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener clientes" });
        res.json(results);
    });
});

app.post('/clientes', (req, res) => {
    const { nombre, tipo, cc, telefono, correo } = req.body;

    const sql = `
        INSERT INTO clientes (nombre, tipo, cc, telefono, correo)
        VALUES (?, ?, ?, ?, ?)
    `;

    conection.query(sql, [nombre, tipo, cc, telefono, correo], (err) => {
        if (err) return res.status(500).json({ error: "Error al agregar cliente" });
        res.json({ message: "Cliente agregado correctamente" });
    });
});

app.put('/clientes/:id', (req, res) => {
    const { nombre, tipo, cc, telefono, correo } = req.body;

    conection.query(
        'UPDATE clientes SET nombre=?, tipo=?, cc=?, telefono=?, correo=? WHERE id=?',
        [nombre, tipo, cc, telefono, correo, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar cliente" });
            res.json({ message: "Cliente actualizado correctamente" });
        }
    );
});

app.delete('/clientes/:id', (req, res) => {
    conection.query('DELETE FROM clientes WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar cliente" });
        res.json({ message: "Cliente eliminado correctamente" });
    });
});



// Listar proyectos
app.get('/proyectos', (req, res) => {
    conection.query("SELECT * FROM proyectos ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener proyectos" });
        res.json(results);
    });
});

// Crear proyecto
app.post('/proyectos', (req, res) => {
    const { nombre_proyecto, cliente, fecha_inicio, fecha_final } = req.body;

    const sql = `
        INSERT INTO proyectos (nombre_proyecto, cliente, fecha_inicio, fecha_final)
        VALUES (?, ?, ?, ?)
    `;

    conection.query(sql, [nombre_proyecto, cliente, fecha_inicio, fecha_final], (err) => {
        if (err) return res.status(500).json({ error: "Error al guardar proyecto" });
        res.json({ message: "Proyecto guardado correctamente" });
    });
});

// Actualizqar proyecto
app.put('/proyectos/:id', (req, res) => {
    const { nombre_proyecto, cliente, fecha_inicio, fecha_final, estado } = req.body;

    const sql = `
        UPDATE proyectos
        SET nombre_proyecto=?, cliente=?, fecha_inicio=?, fecha_final=?, estado=?
        WHERE id=?
    `;

    conection.query(sql, [
        nombre_proyecto,
        cliente,
        fecha_inicio,
        fecha_final,
        estado,
        req.params.id
    ], (err) => {
        if (err) return res.status(500).json({ error: "Error al actualizar proyecto" });
        res.json({ message: "Proyecto actualizado correctamente" });
    });
});

// Eliminar proyecto
app.delete('/proyectos/:id', (req, res) => {
    conection.query("DELETE FROM proyectos WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar proyecto" });
        res.json({ message: "Proyecto eliminado" });
    });
});



// Asociar
app.post('/proyectos/:id/cotizaciones', (req, res) => {
    const { id_cotizacion } = req.body;

    if (!id_cotizacion)
        return res.status(400).json({ error: "Falta id_cotizacion" });

    const sql = `
        INSERT INTO proyecto_cotizaciones (proyecto_id, cotizacion_id)
        VALUES (?, ?)
    `;

    conection.query(sql, [req.params.id, id_cotizacion], (err) => {
        if (err) return res.status(500).json({ error: "Error al asociar cotización" });
        res.json({ message: "Cotización asociada correctamente" });
    });
});

// Ver cotizaciones asociadas
app.get('/proyectos/:id/cotizaciones', (req, res) => {
    const sql = `
        SELECT 
            c.id,
            c.cc_cliente,
            c.fecha,
            c.total
        FROM proyecto_cotizaciones pc
        JOIN cotizaciones c ON c.id = pc.cotizacion_id
        WHERE pc.proyecto_id = ?
        ORDER BY c.id DESC;
    `;

    conection.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener cotizaciones" });
        res.json(results);
    });
});


//iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
