const { pool } = require('../config/db')
const { colombiaOffset } = require('../config/config')
const UserService = require('./userService')
const ApiError = require('../utils/ApiError')
const userService = new UserService()

class Service {
    async getFocusDay(userId, date) {
        await userService.getUser(userId)
        const dateUTC = userService.getLocalDate(new Date(date), colombiaOffset)
        const resultFocus = await pool.query('SELECT * FROM Focus WHERE user_id = $1 AND date = $2', [userId, dateUTC])
        if (resultFocus.rowCount === 0) {
            throw new ApiError('No se encontraron registros', 404)
        }
        const focusDay = resultFocus.rows[0]
        if (focusDay.focus_percentage <= 50) {
            focusDay.quality = 'mala'
        }
        if (focusDay.focus_percentage >= 75) {
            focusDay.quality = 'buena'
        }
        if (focusDay.focus_percentage > 50 && focusDay.focus_percentage < 75) {
            focusDay.quality = 'normal'
        }
        return { focusDay }
    }

    async createFocusDay(userId, createFocusDayData) {
        await userService.getUser(userId)
        const dateUTC = new Date(createFocusDayData.date).toISOString()
        const focusScore = createFocusDayData.productiveTime / createFocusDayData.totalTime * 100
        const resultFocusDay = await pool.query(`
            INSERT INTO Focus 
            (user_id, date, total_time, productive_time, distractions_count, focus_percentage, mood_score, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                userId,
                dateUTC,
                createFocusDayData.totalTime,
                createFocusDayData.productiveTime,
                createFocusDayData.totalSwitches,
                focusScore,
                createFocusDayData.moodScore,
                createFocusDayData.notes
            ]
        )
        return { newFocusDay: resultFocusDay.rows[0] }
    }

    linearRegression(points) {
        if (points.length < 2) {
            return { slope: 0, intersection: points[0]?.y ?? 0 }
        }

        let promedioX = 0
        let promedioY = 0

        for (const point of points) {
            promedioX += Number(point.x)
            promedioY += Number(point.y)
        }

        promedioX = promedioX / points.length
        promedioY = promedioY / points.length
        let sumatoriaXY = 0
        let sumatoriaX2 = 0

        for (const point of points) {
            sumatoriaXY += (point.x - promedioX) * (point.y - promedioY)
            sumatoriaX2 += (point.x - promedioX) * (point.x - promedioX)
        }

        if (sumatoriaX2 === 0) {
            return { slope: 0, intersection: promedioY }
        }

        const slope = sumatoriaXY / sumatoriaX2
        const intersection = promedioY - (slope * promedioX)
        return { slope, intersection }
    }

    async getFocusRange(userId, startDate, endDate) {
        await userService.getUser(userId)
        const startdateUTC = userService.getLocalDate(new Date(startDate), colombiaOffset)
        const endDateUTC = userService.getLocalDate(new Date(endDate), colombiaOffset)
        const resultFocusAverage = await pool.query(`
            SELECT AVG(focus_percentage) as promedio 
            FROM Focus 
            WHERE user_id = $1 AND date BETWEEN $2 AND $3;`,
            [
                userId,
                startdateUTC,
                endDateUTC
            ]
        )
        if (resultFocusAverage.rows[0].promedio === null) {
            throw new ApiError('No se encontraron registros', 404)
        }
        const resultFocusBestDay = await pool.query(`
            SELECT date FROM Focus WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY focus_percentage DESC LIMIT 1;`,
            [
                userId,
                startdateUTC,
                endDateUTC
            ]
        )
        if (resultFocusBestDay.rowCount === 0) {
            throw new ApiError('No se encontraron registros', 404)
        }
        const resultFocusWorstDay = await pool.query(`
            SELECT date FROM Focus WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY focus_percentage ASC LIMIT 1;`,
            [
                userId,
                startdateUTC,
                endDateUTC
            ]
        )
        if (resultFocusWorstDay.rowCount === 0) {
            throw new ApiError('No se encontraron registros', 404)
        }
        const resultFocusRegression = await pool.query(`
            SELECT date, focus_percentage FROM Focus WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
            [
                userId,
                startdateUTC,
                endDateUTC
            ]
        )
        if (resultFocusRegression.rowCount === 0) {
            throw new ApiError('No se encontraron registros', 404)
        }
        const map = resultFocusRegression.rows.map((data, index) => ({
            x: index,
            y: data.focus_percentage
        }))

        const { slope, intersection } = this.linearRegression(map)
        let status
        if (slope > 0.5) status = 'mejorando'
        else if (slope < -0.5) status = 'empeorando'
        else status = 'estable'

        const bestDay = userService.getLocalDate(resultFocusBestDay.rows[0].date, colombiaOffset)
        const worstDay = userService.getLocalDate(resultFocusWorstDay.rows[0].date, colombiaOffset)

        return {
            average: resultFocusAverage.rows[0].promedio,
            bestDay,
            worstDay,
            trend: {
                slope,
                status
            }
        }
    }

    getMessageByHour(hourlyData) {
        const avgGlobal = hourlyData.reduce((sum, h) => sum + h.avg, 0) / hourlyData.length;

        // Mensajes posibles
        const messages = [];

        // 1️⃣ Caída en la noche
        const nightDrop = hourlyData.find(h => h.hour >= 19 && h.avg < avgGlobal - 5);
        if (nightDrop) messages.push('Tu foco cae después de las 7pm');

        // 2️⃣ Pico en la mañana
        const morningPeak = hourlyData.find(h => h.hour >= 6 && h.hour <= 10 && h.avg > avgGlobal + 5);
        if (morningPeak) messages.push('Tu foco es más alto en la mañana');

        // 3️⃣ Inestabilidad durante el día
        const maxAvg = Math.max(...hourlyData.map(h => h.avg));
        const minAvg = Math.min(...hourlyData.map(h => h.avg));
        if (maxAvg - minAvg > 20) messages.push('Tu foco varía mucho durante el día');

        // 4️⃣ Foco constante
        if (messages.length === 0) messages.push('Mantienes un foco estable durante todo el día');

        // Retornar el primer mensaje relevante (o podrías unirlos)
        return messages[0];
    }


    async getFocusSummary(userId, today) {
        await userService.getUser(userId)
        const dateUTC = userService.getLocalDate(new Date(today), colombiaOffset)
        const day = new Date(dateUTC).getDay()
        const startWeekDate = new Date(new Date(dateUTC).setUTCDate(new Date(dateUTC).getDate() - day))
        const endWeekDate = new Date(new Date(startWeekDate).setUTCDate(new Date(startWeekDate).getDate() + 7))
        const startMonthDate = new Date(new Date(dateUTC).setUTCDate(1))
        const endMonthDate = new Date(new Date(dateUTC).setUTCDate(31))
        const resultFocusToday = await pool.query(`
            SELECT * 
            FROM Focus 
            WHERE user_id = $1 AND date = $2;`,
            [
                userId,
                dateUTC
            ]
        )
        if (resultFocusToday.rowCount === 0) {
            throw new ApiError('No hay registros de Focus hoy', 404)
        }
        const resultFocusWeek = await pool.query(`
            SELECT AVG(focus_percentage) as promedio 
            FROM Focus 
            WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
            [
                userId,
                startWeekDate,
                endWeekDate
            ]
        )
        const resultFocusMonth = await pool.query(`
            SELECT AVG(focus_percentage) as promedio 
            FROM Focus 
            WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
            [
                userId,
                startMonthDate,
                endMonthDate
            ]
        )

        let status
        let message = null

        if (resultFocusWeek.rows[0].promedio > resultFocusMonth.rows[0].promedio + 3) status = 'mejorando'
        else if (resultFocusWeek.rows[0].promedio < resultFocusMonth.rows[0].promedio - 3) status = 'empeorando'
        else status = 'estable'

        const resultSummaryMessage = await pool.query(`
            SELECT AVG(focus_score) as avg, EXTRACT(HOUR FROM start_time) as hour FROM Deep_Work WHERE user_id = $1 GROUP BY hour ORDER BY hour;`,
            [
                userId
            ]
        )

        message = this.getMessageByHour(resultSummaryMessage.rows)

        return {
            today: resultFocusToday.rows[0].focus_percentage,
            thisWeek: resultFocusWeek.rows[0].promedio,
            thisMonth: resultFocusMonth.rows[0].promedio,
            status,
            message,
        }
    }

    async analizeWithAi(focusData, deepWorkData, startDay, endDay) {
        const response = await fetch('http://192.168.8.8:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: [
                    {
                        role: 'system',
                        content:
                            'Eres un psicólogo profesional especializado en la concentración y mejora del foco. ' +
                            'Analiza datos de hábitos, sesiones y tiempo. Da insights claros y recomendaciones prácticas. ' +
                            'Devuelve SOLO un JSON válido con esta estructura exacta (deben tener los dos parametros insights y recommendations):\n\n' +
                            '{ "insights": string[], "recommendations": string[] }\n\n' + 'No se te pueden olvidar las recommendations'
                    },
                    {
                        role: 'user',
                        content: `
                            Periodo: ${startDay} a ${endDay}

                            FOCUS DATA:
                            ${JSON.stringify(focusData, null, 2)}

                            DEEP WORK DATA:
                            ${JSON.stringify(deepWorkData, null, 2)}
                            `
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                stream: true
            })
        })

        return response
    }

    async getFocusAnalisys(userId, startDate, endDate) {
        await userService.getUser(userId)
        const startDateUTC = userService.getLocalDate(new Date(startDate), colombiaOffset)
        const endDateUTC = userService.getLocalDate(new Date(endDate), colombiaOffset)
        const resultFocusData = await pool.query(`
            SELECT * FROM Focus WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
            [
                userId,
                startDateUTC,
                endDateUTC
            ]
        )
        if (resultFocusData.rowCount === 0) {
            throw new ApiError('No hay registros en Focus', 404)
        }
        const resultDeepWorkData = await pool.query(`
            SELECT * FROM Deep_Work WHERE user_id = $1 AND start_time BETWEEN $2 AND $3`,
            [
                userId,
                startDateUTC,
                endDateUTC
            ]
        )
        if (resultDeepWorkData.rowCount === 0) {
            throw new ApiError('No hay registros en Deep Work', 404)
        }
        const response = await this.analizeWithAi(resultFocusData.rows, resultDeepWorkData.rows, startDateUTC, endDateUTC)
        return response
    }
}

module.exports = Service