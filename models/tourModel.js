const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    // primul {} obiect cu definitia schemei
    name: {
      type: String,
      required: [true, 'A tour must have a name.'], // required se numeste validator, valideaza daca numele este acolo
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less than 40 characters.'], // maxlength si minlength sunt tot un validator
      minlength: [10, 'A tour must have at least 10 characters.'],
      // validator: [validator.isAlpha, 'A tour must only contain characters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        // enum merge doar pt stringuri
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is easy, medium or difficult.', // message este eroarea daca valorile nu sunt din enum
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // val e priceDiscount; this arata numai inspre documentul curent la crearea unui document nou
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be lower than price.', // aici {VALUE} este egal cu val; mongoose stuff
      },
    },
    summary: {
      type: String,
      trim: true, // sterge spatiile de la inceputul si sfarsitul unui String
      required: [true, 'A tour must have a decription.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // vom citi numele imaginii din file system
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String], // am pus String in [] ca sa specificam ca ne asteptam la un array de Stringuri
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // ca sa nu mai apara la GET
    },
    startDates: [Date],
    secretTour: {
      tpye: Boolean,
      default: false,
    },
  },
  {
    // in al doilea {} punem optiunile schemei
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// proprietatile virtuale sunt create de fieccare data cand facem operatiune GET si nu se salveaza in schema pentru a
// face economie de spatiu
// nu putem folosi proprietatile virtuale in queryuri
tourSchema.virtual('durationWeeks').get(function () {
  // aici am folosit functie normala (nu arrow) ca sa avem acces la this
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() (metode Mongoose)

// pre-save hook
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   // aici nu mai avem keywordul this in post
//   console.log(doc);
//   next(); // nu avem nevoie de next() pentru ca acest post e singurul dar e good practice sa-l punem de fiece data
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  // acel REGEX face ca orice metoda cre incepe cu find in nume din tourController sa treaca prin acel middleware
  // this pointuieste la queryul current nu la document
  this.find({ secretTour: { $ne: true } }); // vrem sa primim numai tururi care nu sunt secretizate ($ne = not equal)

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds.`);
  // console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // this pointuieste catre obiectul aggregat

  console.log(this.pipeline());
  next();
});
// mai jos am creat un model folosind schema creata anterior
const Tour = mongoose.model('Tour', tourSchema); // tot timpul folosim uppercase la prima litera la modele si variabile

module.exports = Tour;

// mongoose middleware se numesc pre-hooks si post-hooks pentru ca putem defini functii care se executa
// inainte sau dupa anumite evenimente
// tipuri de middleware in Mongoose: document, query, aggregate si model
// middleware-urile se definesc pe Schema
