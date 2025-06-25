const Employee = require('../models/employee');
const jwt = require('jsonwebtoken');

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { fullName, email, phone, position, department, dateOfJoining } = req.body;
    const employee = new Employee({
      fullName,
      email,
      phone,
      position: position || 'Intern',
      department: department || 'Default',
      dateOfJoining: dateOfJoining || new Date()
    });
    const savedEmployee = await employee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create employee', error: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, position, department, dateOfJoining } = req.body;
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { fullName, email, phone, position, department, dateOfJoining },
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update employee', error: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete employee', error: error.message });
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };