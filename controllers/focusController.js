const FocusService = require('../services/focusService')
const Service = new FocusService()

const getFocusDay = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { date } = req.params
        const response = await Service.getFocusDay(userId, date)
        return res.json(response)
    } catch (err) {
        console.error(err)
        next(err)
    }
}

const createFocusDay = async (req, res, next) => {
    try {
        const { userId } = req.user
        const createFocusDayData = req.body
        const response = await Service.createFocusDay(userId, createFocusDayData)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

const getFocusRange = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { startDate, endDate } = req.query
        const response = await Service.getFocusRange(userId, startDate, endDate)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

const getFocusSummary = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { today } = req.query
        const response = await Service.getFocusSummary(userId, today)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

const getFocusAnalisys = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { startDate, endDate } = req.query
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.flushHeaders()
        const response = await Service.getFocusAnalisys(userId, startDate, endDate)
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let finalContent = ''

        while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            res.write(chunk)

            const lines = chunk.split('\n')
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue

                const data = line.slice(6).trim()
                if (!data || data === '[DONE]') continue

                const json = JSON.parse(data)
                const delta = json.choices?.[0]?.delta

                if (delta?.content) {
                    finalContent += delta.content
                }
            }
        }
        res.write(`event: final\ndata: ${JSON.stringify({
            content: finalContent
        })}\n\n`)

        return res.end()
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getFocusDay,
    createFocusDay,
    getFocusRange,
    getFocusSummary,
    getFocusAnalisys,
}