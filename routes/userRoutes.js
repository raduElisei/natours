const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup); // nu are legatura ccu stilul arhitectural REST deoarece nu are sens
router.post('/login', authController.login);

router
  .route('/') // conform cu arhiectura REST numele URI-ului nu are legatura cu metodele/actiunile folosite
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
