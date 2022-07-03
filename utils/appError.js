class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // chemam constructorul-parinte cu singurul argument pe care Error il accepta: "message"

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // daca statusCode incepe cu 4 (400, 404, etc) atunci e fail altfel este error

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // facem ca atunci cand este creata o eroare din clasa noastra, sa nu apara eroarea in Stack Trace
  }
}

module.exports = AppError;
