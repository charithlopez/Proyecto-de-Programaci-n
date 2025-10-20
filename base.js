const mysql = require('mysql2');

const conection = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // o tu usuario de MySQL
    password: '',       // tu contraseña de MySQL (vacía si no tienes)
    database: 'gestor_obra'
});

conection.connect(err => {
    if (err) {
        console.error('Error de conexión:', err);
    } else {
        console.log('Conectado a la base de datos MySQL');
    }
});

module.exports = conection;


