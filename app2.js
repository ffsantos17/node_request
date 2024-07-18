var http = require('http');
var mysql = require('mysql');
const uuid = require('uuid');

const uuid4 = uuid.v4()
console.log(uuid4)

var conn = mysql.createConnection({
    host: 'localhost', // Replace with your host name
    user: 'root', // Replace with your database username
    password: '', // Replace with your database password
    database: 'projeto_ifs' // // Replace with your database Name
});

conn.connect(function(err) {
    if (err) {
      console.log('Erro connecting to database...', err)
      return
  }
  console.log('Database conectado!');
});

conn.query('SELECT * FROM usuario', function(error, results, fields) {
  if (error){
    console.log('Erro connecting to database...', error)
    return
}
console.log( results.length)
});
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var message = 'It worksss!\n',
    version = 'NodeJS ' + process.versions.node + '\n',
    response = [message, version].join('\n');
        



    
});
server.listen(3000, () => console.log('Server is running on port 3000'));
