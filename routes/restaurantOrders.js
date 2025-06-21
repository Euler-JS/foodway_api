const express = require('express');
const router = express.Router({ mergeParams: true });
const orderController = require('../controllers/orderController');

// GET /api/v1/restaurants/:restaurant_id/orders
router.get('/', (req, res, next) => {
  req.query.restaurant_id = req.params.restaurant_id;
  orderController.index(req, res, next);
});

// POST /api/v1/restaurants/:restaurant_id/orders
router.post('/', (req, res, next) => {
  req.body.restaurant_id = parseInt(req.params.restaurant_id);
  orderController.store(req, res, next);
});

module.exports = router;