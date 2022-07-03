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

// acum creem un "instance method" care va fi valabila doar documentelor unei anumite colectii
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password nu e valabil din cauze faptului ca nu e valabil in output (e selected: false)
  return await bcrypt.compare(candidatePassword, userPassword); // returneaza true/false
};

const User = mongoose.model('User', userSchema);

module.exports = User;
