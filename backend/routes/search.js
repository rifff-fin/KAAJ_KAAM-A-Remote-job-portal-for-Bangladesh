const express = require('express');
const router = express.Router();
const { globalSearch, searchSuggestions } = require('../controllers/searchController');

// Global search endpoint
router.get('/', globalSearch);

// Quick search suggestions for autocomplete
router.get('/suggestions', searchSuggestions);

module.exports = router;
