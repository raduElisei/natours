const fs = require('fs');
const Tour = require('./../../models/tourModel');
const mongoose = require('mongoose');
//importam dot-env pentru ca server.js sa foloseasca variabilele de environment din config.env
const dotenv = require('dotenv');

// aici in dotenv.config efectiv citim variabilele din config.env
dotenv.config({ path: './config.env' });
// de ce variabilele env sunt valabile in toate fisierele din proiect? deoarece config.env e citit doar odata si apoi este in proces care nu se schimba chiar daca suntem in alt fisier

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
); // connection string

mongoose.connect(DB).then(() => console.log('DB connection successful!')); // con e connection object

// READ JSON FILE

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// IMPORT DATA INTO DB

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// DELETE ALL DATA FROM COLLECTION

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
    process.exit(); // este o metoda agresiva de a opri o aplicatie dar e ok aici
  } catch (err) {
    console.log(err);
  }
};

// asta e pentru CLI facem ca daca scriem node .\dev-data\data\import-dev-data.js --import sa ruleze
// importData si deleteData pentru optiunea --delete, aceste optiuni le citim cu ajutorul process.argv
// care ne da argumentele pasate cand rulam CLI-ul, primul argument este pozitia in file system al node
// al doilea este directorul fisierului .js pe care-l rulam si de la al 3-lea argument in sus sunt optiunile
// iar ca sa selectam argumentul 3 folosim process.argv[2]

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
