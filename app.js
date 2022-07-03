// app.js este, de obicei, folosit pentru declararea middleware-ului
// app.js este folosit aici ca sa separam codul express de restul aplicatiilor, de asta server.js este separat

const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// start express app
const app = express(); //ca sa putem folosi metode express pe "app"

// 1. MIDDLEWARES - sunt aplicate pe toate rutele sau pe rute cu anumiti parametri - "param" middleware

//aici facem ca morgan sa fie folosit numai daca suntem in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Morgan is an HTTP request level Middleware. It is a great tool that logs the requests along with some other information depending upon its configuration and the preset used. It proves to be very helpful while debugging and also if you want to create Log files.

app.use(express.json()); //asta e middleware, o functie care modifica requestul care vine, middleware pnetru ca sta intre req si res

app.use(express.static(`${__dirname}/public`)); //folosim static pentru a servi fisiere statice (nu foldere)
// ca sa accesam in browser overview.html trebuie sa scriem http://127.0.0.1:3000/overview.html fara "public" deoarece 127.0.0.1:3000 devine 127.0.0.1:3000/public

// in acest caz, datele din body sunt adaugate in obiectul request

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// app.get('/', (req, res) => {
//   //.get() e metoda http pentru requesturi
//   res //res e trimis numai cand methoda GET e trimisa catre server de altundeva pe url-ul "/" adica root
//     .status(200)
//     .json({ message: 'Hello from the server side!', app: 'Natours' }); //putem folosi .send('')ca sa trimitem un mesaj sau chiar un .json
// }); //aici facem rutare cu metoda http "GET"

// handlerele sunt numite si controllere

// app.get('/api/v1/tours', getAllTours); // sinonim cu app.route('/api/v1/tours').get(getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3. ROUTES

app.use('/api/v1/tours', tourRouter); //aici am mountuit rutele noastre
app.use('/api/v1/users', userRouter); // ele isi aplica middleware-urile "tourRouter" si "userRouter" doar pe caile /api/v1/tours si /api/v1/users
// am folosit app.use pentru a mountui middlewareurile pe rute

// .all() ruleaza pentru toate verbele/metodele http
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // daca pasam un argument in next() Express va sti ca e o eroare, va skipui celelalte middlewareuri si va trimite eroarea la middlewareul ce handleuieste erori
});

app.use(globalErrorHandler);

module.exports = app; //exportam app pentru server.js
