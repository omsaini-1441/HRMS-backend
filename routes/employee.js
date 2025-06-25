const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteEmployee } = require('../controller/employee');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getEmployees);
router.post('/', authMiddleware, createEmployee);
router.patch('/:id', authMiddleware, updateEmployee);
router.delete('/:id', authMiddleware, deleteEmployee);

module.exports = router;