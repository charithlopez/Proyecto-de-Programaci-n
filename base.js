const mysql = require('mysql2');

const conection = mysql.createConnection({
    host: 'localhost',
    user: 'root',       
    password: '',       
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


