const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// mai jos preumplem proprietatile obiectului query inainte de a ajunge la handlerul getAllTours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) // ".." inseamna "du-te sus un folder"
// );

// exports.checkID = (req, res, next, val) => {
//   //facem aceasta functie ca sa fie chemata de fiecare data cand avem id in url si sa verificam daca resursa exista doar in aceasta functie si nu in routes la fiecare functie in parte, astfel functiile din rute face exact ce spun si doar ce spun ca fac (getTour ne da tururile)
//   console.log(`Tour id is ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     // daca tour nu exista (undefined)
//     return res.status(404).json({
//       //return este important deoarece iesim din functia checkID altfel ar trimite raspunsul si dupa ar da next() care ar genera o eroare deoarece nu mai putem sa punem headere dupa res.
//       status: 'fail', //status: fail tine de 404
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

exports.getAllTours = catchAsync(async (req, res) => {
  // // BUILD QUERY
  // // 1A)FILTERING
  // const queryObj = { ...req.query }; // "..." este destructurare si ia toate fieldurile in afara obiectului
  // // facem asta ca sa creem un "hard copy" al obiectului (nu vrem ca queryObj sa pointuiasca catre req.query ci vrem ca
  // // queryObj sa fie egal cu req.query in acea instanta)

  // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  // excludedFields.forEach((el) => delete queryObj[el]); // din queryObj stergem elementele cu aceleasi nume ca cele din
  // // excludedFields

  // // 1B) ADVANCED FILTERING

  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // // in lumea reala ar trebui sa scriem documentatie ca utilizatorul sa stie ce operatii se pot face pe API
  // // am specifica ce requesturi se pot face, ce metode http se pot folosi, ce filtre si sortari putem face

  // // {difficulty: 'easy', duration: { $gte: 5}} // pentru a folosi operatori (cum facem la duration sa fie mai mare sau
  // // egal cu 5) trebuie sa incepem un alt obiect "{}"
  // // gte, gt, lte, lt

  // // console.log(req.query, queryObj); // req.query ne da un object cu datele din query string
  // // ne apare in consola cand folosim getAllTours
  // // console.log(req.requestTime);

  // // const tours =  Tour.find()
  // //   .where('duration')
  // //   .equals(5)
  // //   .where('difficulty')
  // //   .equals('easy');

  // // ca sa filtram cu MongoDB pasam un obiect filtru in find()
  // let query = Tour.find(JSON.parse(queryStr));

  // 2) SORTING
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  //   // sort('price ratingsAverage')
  // } else {
  //   query = query.sort('-createdAt');
  // }

  // 3) FIELD LIMITING
  // Vrem ca sa se execute cat mai putin cod pe partea de client ca sa nu creasca latimea de banda
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  //   // operatiunea prin care selectam doar anumite nume de field-uri se numeste projecting
  // } else {
  //   query = query.select('-__v'); // excludem fieldurile cu "__v" care este doar folosit intern de Mongoose
  // }

  // 4) PAGINATION

  // const page = req.query.page * 1 || 1; // vrem ca page sa fie req.query.page sau 1 by default
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;

  // // page=10&limit=2, 1-10: page 1, 11-20: page 2...
  // // pentru a ajunge la pagina 2 dam skip la 10 rezultate
  // query = query.skip(skip).limit(limit);

  // if (req.query.page) {
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) throw new Error('This page does not exist');
  // }

  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // query.sort().select().skip().limit()

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    // requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({_id: req.params.id}) e sinonim cu ce e mai sus
  // intre {} avem filter object, _id e proprietatea pe care o cautam si req.params.id este valoare proprietatii

  if (!tour) {
    return next(new AppError('No tour found with this ID.', 404)); // trebuie sa folosim return ca sa iesim din functie
  }

  res.status(200).json({
    data: tour,
  });

  // const tour = tours.find((el) => el.id === id); //tour va contine toate obiectele din tours cu id-ul precizat in GET
  // res.status(200).json({
  //   // ca sa ai parametri optionali pui "?" dupa ex: /:param?/
  //   status: 'success',
  //   results: tours.length,
  //   data: {
  //     tour,
  //   },
  // });
});

// puteam sa folosim catchAsync() si in tourRoutes la toate functiile async dar e mai usor in controller
// plus ca nu toate rutele folosesc functii async
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body); // metoda a fost folosita pe modelul insasi de asemenea create() returneaza o promisiune
  // req.body vine din POST body care va fi pus in variabila-document newTour
  // try {
  // const newTour = new Tour({}); // Tour este si clasa iar .save() (metoda de folosit pe obiecte prototip (adica instante ale claselor)) e folosit pe instanta newTour
  // newTour.save(); // metoda a fost folosita pe document

  // // datele primite de la client ce trebuie postate intra in req
  // // console.log(req.body); //body este valabil deoarece am utilizat acel middleware de la inceput
  // const newId = tours[tours.length - 1].id + 1;
  // const newTour = Object.assign({ id: newId }, req.body);
  // tours.push(newTour);
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours), //aici tours e doar un obiect javascript deci trebuie JSON-izat
  //   (err) => {
  res.status(201).json({
    // 201 inseamna "created"
    status: 'success',
    data: {
      tour: newTour,
    },
  });
  //   }
  // );

  // res.status(201).json({
  //   // 201 inseamna "created"
  //   status: 'success',
  //   data: {
  //     tour: newTour,
  //   },
  //   });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    // findById returneaza un obiect query
    new: true, //ca sa trimitem inapoi documentul nou
    runValidators: true, // valideaza docmentul in raport cu schema modelului
  });

  if (!tour) {
    return next(new AppError('No tour found with this ID.', 404)); // trebuie sa folosim return ca sa iesim din functie
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour, // in ES6 este sinonim cu tour: tour deoarece au acelasi nume
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with this ID.', 404)); // trebuie sa folosim return ca sa iesim din functie
  }

  res.status(204).json({
    //"204" = no content, pentru ca nu trimitem date inapoi
    status: 'success',
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  // aici definim mai multe stadii, documentele trec prin stadii in ordinea din cod, secvential
  // fiecare stadiu e un obiect notat "{}"
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null, // nu punem criteriu la id ca sa avem tot la dispozitie
        // _id: '$difficulty', // grupam toate statsurile de ma jos in functie de dificultate
        // avand statsuri separate pentru dificultate mica, medie si mare
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 }, // adaugam 1 la counter pt. fiecare document
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, // facem field nou numit "avgRating"
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // putem folosi numai variabilele anterioare deoarece am modificat documentul in timp ce trecea prin pipeline, "1" inseamna in sens crescator
    },
    // putem repeta stadii (aici inca un stadiu match)
    // {
    //   $match: { _id: { $ne: 'EASY' } }, // aici ID este diffciulty de la ultima procesare din pipeline
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // deconstruieste un field de tip array pentre a outputui un document pentru fiecare element
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, // 0 ca sa nu mai apara, 1 ca sa apara
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
