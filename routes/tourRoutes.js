const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router(); // se numeste "mounting new router"

// 1. MIDDLEWARES - sunt aplicate pe toate rutele sau pe rute cu anumiti parametri - "param" middleware

// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours) // getAllTours nu ruleaza decat daca mai intai ruleaza protect
  .post(tourController.createTour); //poate fi chainuit cu toate operatiile ce tin de '/api/v1/tours'

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
