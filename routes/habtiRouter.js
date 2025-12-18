const express = require('express')
const jwtHandler = require('../middlewares/authHandler')
const schemaHandler = require('../middlewares/schemaHandler')
const { createHabitSchema, updateHabitSchema, getHabitSchema, deleteHabitSchema, completeHabitSchema, cancelHabitSchema } = require('../schemas/habitSchema')
const { createHabit, getHabit, getHabits, deleteHabit, updateHabit, completeHabit, cancelHabit } = require('../controllers/habitController')
const router = express.Router()

router.post('/', jwtHandler, schemaHandler(createHabitSchema, 'body'), createHabit)
router.get('/', jwtHandler, getHabits)
router.get('/:id', jwtHandler, schemaHandler(getHabitSchema, 'params'), getHabit)
router.delete('/:id', jwtHandler, schemaHandler(deleteHabitSchema, 'params'), deleteHabit)
router.patch('/:id', jwtHandler, schemaHandler(getHabitSchema, 'params'), schemaHandler(updateHabitSchema, 'body'), updateHabit)
router.post('/complete-habit/:id', jwtHandler, schemaHandler(getHabitSchema, 'params'), schemaHandler(completeHabitSchema, 'body'), completeHabit)
router.post('/cancel-habit/:id', jwtHandler, schemaHandler(getHabitSchema, 'params'), schemaHandler(cancelHabitSchema, 'body'), cancelHabit)

module.exports = router