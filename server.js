const mongoose = require('mongoose');

//importam dot-env pentru ca server.js sa foloseasca variabilele de environment din config.env
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down!');
  console.log(err.name, err.message);
  process.exit(1);
});

// aici in dotenv.config efectiv citim variabilele din config.env
dotenv.config({ path: './config.env' });
// de ce variabilele env sunt valabile in toate fisierele din proiect? deoarece config.env e citit doar odata si apoi este in proces care nu se schimba chiar daca suntem in alt fisier

// este practica buna sa avem tot ce tine de express intr-un fisier si tot ce tine de server in alt fisier
// server.js devine entrypoint-ul nostru
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
); // connection string

mongoose.connect(DB).then(() => console.log('DB connection successful!'));

// env este o variabila globala care ne spune in ce environment ne aflam (development, production, etc); env tine de express, process.env tine de node.js
// console.log(app.get('env'));

// console.log(process.env);
// toate variabilele vin din core module, process nu trebuie required e valabil by default
const port = process.env.PORT || 3000; // aici port va alege intre variabila de environment iar daca nu, 3000
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
}); // porneste un server

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down!');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
