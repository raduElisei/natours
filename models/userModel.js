const crypto = require('crypto');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const { default: isEmail } = require('validator/lib/isEmail');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a username.'],
    trim: true,
    maxlength: [20, 'A username must have less than 20 characters'],
    minlength: [3, 'A username must have more than 3 characters.'],
  },
  slug: String,
  email: {
    type: String,
    required: [true, 'A user must have an email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'A user must have a valid email.'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password.'],
    minlength: 8,
    select: false, // sa nu arate pe partea de client parola criptata
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Type password again.'],
    validate: {
      // Asta merge numai la CREATE and SAVE!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords don't match.",
    },
  },
  passwordChangedAt: Date, // majoritatea userilor nu vor avea asta deoarece nu-si schimba parola
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// pre save document middleware pentru criptarea parolei
// pre se intampla intre momentul cand primim datele la server si momentul salvarii in DB
userSchema.pre('save', async function (next) {
  // only run function if password was modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  // 12 e un cost-parameter (default 10) folosim 12 pentru ca calc sunt mai puternice acum, cu cat costul e mai mare cu cat resursele necesare pt CPU sunt mai mari dar si parola va fi mai bine criptata

  // delete password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // aceasta functie ruleaza inainte de salvare in DB
  if (!this.isModified('password') || this.isNew) return next(); // daca parola nu e modificata nu schimba proprietatea passwordChangedAt

  this.passwordChangedAt = Date.now() - 1000; // ne asiguram ca passwordChangedAt e creat inainte de datul jwt-ului
  next();
});

// acum creem un "instance method" care va fi valabila doar documentelor unei anumite colectii
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password nu e valabil din cauze faptului ca nu e valabil in output (e selected: false)
  return await bcrypt.compare(candidatePassword, userPassword); // returneaza true/false
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp; // 100 < 200 => true, parola a fost schimbata dupa token
  }

  return false; // default false adica nu a fost schimbata parola dupa timestamp
};

userSchema.methods.createPasswordResetToken = function () {
  // il cream separat de authController
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
