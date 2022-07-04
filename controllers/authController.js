const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // aici puteam sa lasam User.create(req.body) dar asta insemna ca userul putea inputa ce dorea el in plus la name, email, password (cum ar fi daca am avea un admin: true sau ceva de genul)
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  const jwtToken = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    jwtToken,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and pass exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check is user exists %% password is correct
  const user = await User.findOne({ email }).select('+password'); // folosim "+" pentru ca password nu este selected(nu apare pa partea clientului)

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401)); // 401 inseamna neautorizat
    // suntem intentonat vagi (email or password ca sa facem viata atacatorilor mai grea)
  }

  // 3) If everything is ok, send token to client
  const jwtToken = signToken(user._id);
  res.status(200).json({
    status: 'success',
    jwtToken,
  });
});

// functie middleware de protejare a rutelor pentru ca sa poate fi accesate numai daca esti logat cu un JWT valid
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get jwt and check if it exists

  // la conditia if headerul 'authorization' trebuie sa exista si campul lui 'authorization' trebuie sa inceapa cu 'Bearer' care este inceputul standard
  let jwtToken; // nu initializam jwtToken in if deoarece nu va fi valabil in afara blockului if
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    jwtToken = req.headers.authorization.split(' ')[1];
  }

  if (!jwtToken) {
    return next(
      new AppError('You are not logged in. Log in to get access.', 401)
    );
  }
  // 2) Verification of jwt
  const decoded = await promisify(jwt.verify)(jwtToken, process.env.JWT_SECRET); // aici am promisificat jwt.verify

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id); // aici ne asiguram ca userul inca exista dupa ce s-a verificat jwt-ul
  if(!currentUser) {
    return next(new AppError('The user belonging to this user does no longer exist.', 401)); // daca userul a fost sters dupa ce s-a issue-it jwt atunci eroare, pentru ca cineva poate intercepta jwt-ul dupa ce userul a fost sters ca sa foloseasca API-ul ca acel user
  }

  // 4) Check if user changed password after JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again!', 401));
  }
  
  // Grant acces to protected route (in route handler)
  req.user = currentUser;
  next();
});
