const express = require('express')
const jwtHandler = require('../middlewares/authHandler')
const schemaHandler = require('../middlewares/schemaHandler')
const { createHabitSchema, updateHabitSchema, getHabitSchema, deleteHabitSchema } = require('../schemas/habitSchema')
const { createHabit, getHabit, getHabits, deleteHabit, updateHabit } = require('../controllers/habitController')
const router = express.Router()

router.post('/', jwtHandler, schemaHandler(createHabitSchema, 'body'), createHabit)
router.get('/', jwtHandler, getHabits)
router.get('/:id', jwtHandler, schemaHandler(getHabitSchema, 'params'), getHabit)
router.delete('/:id', jwtHandler, schemaHandler(deleteHabitSchema, 'params'), deleteHabit)
router.patch('/:id', jwtHandler, schemaHandler(getHabitSchema, 'params'), schemaHandler(updateHabitSchema, 'body'), updateHabit)

module.exports = router