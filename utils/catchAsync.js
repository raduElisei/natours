module.exports = (fn) => {
  return (req, res, next) => {
    // folosim o functie anonima pentru ca trebuie sa returnam o functie si nu rezultatul unei functii
    fn(req, res, next).catch(next); // .catch(next) (sinonim cu catch((err) => next(err)) ) prinde efectiv eroarea
  };
};
