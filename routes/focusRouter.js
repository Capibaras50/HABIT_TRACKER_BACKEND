const express = require('express')
const { getFocusAnalisys, getFocusDay, getFocusRange, getFocusSummary, createFocusDay } = require('../controllers/focusController')
const jwtHandler = require('../middlewares/authHandler')
const schemaHandler = require('../middlewares/schemaHandler')
const { getFocusDaySchema, createFocusDaySchema, getFocusRangeSchema, getFocusSummarySchema, getFocusAnalizeSchema } = require('../schemas/focusSchema')
const router = express.Router()

router.get('/day/:date', jwtHandler, schemaHandler(getFocusDaySchema, 'params'), getFocusDay)
router.post('/day', jwtHandler, schemaHandler(createFocusDaySchema, 'body'), createFocusDay)
router.get('/range', jwtHandler, schemaHandler(getFocusRangeSchema, 'query'), getFocusRange)
router.get('/summary', jwtHandler, schemaHandler(getFocusSummarySchema, 'query'), getFocusSummary)
router.post('/analize', jwtHandler, schemaHandler(getFocusAnalizeSchema, 'query'), getFocusAnalisys)

module.exports = router