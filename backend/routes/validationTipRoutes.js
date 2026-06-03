const express = require('express');
const router = express.Router();
const {
  getValidationTips
} = require('../controllers/validationTipController');

router.get('/', getValidationTips);

module.exports = router;
