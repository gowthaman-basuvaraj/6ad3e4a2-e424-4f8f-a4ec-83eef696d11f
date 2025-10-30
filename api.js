import dotenv from 'dotenv'
import express from 'express'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import pino from 'pino'
import bento from "./utils/cache.js";


dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {target: 'pino-pretty'}
})

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.json())
app.use('/public', express.static('public'))

const loggerMiddleWare = function (req, res, next) {
    logger.info(`Request received: ${req.method} ${req.url}`)
    next()
    logger.info(`Request completed: ${req.method} ${req.url}`)
}
app.use(loggerMiddleWare)

const get_db = async () => {
    // open the database
    return await open({
        filename: './data/database.sqlite',
        driver: sqlite3.Database
    })
}
const dashboard_sql = `select date(timestamp, 'start of month') as month,
                              sum(carbon_saved)                 as carbon_saved,
                              sum(fueld_saved)                  as fueld_saved
                       from device_saving
                       where month is not null
                       group by month`

const dashboard_chart_sql = `select date(timestamp, 'start of day') as day,
                                    sum(carbon_saved)               as carbon_saved,
                                    sum(fueld_saved)                as fueld_saved
                             from device_saving
                             where day is not null
                             group by day`

const date_range_sql = `select sum(carbon_saved) as carbon_saved,
                               sum(fueld_saved)  as fueld_saved
                        from device_saving
                        where timestamp > ?
                          and timestamp < ?`

get_db().then(db => {

    app.get('/api/dashboard', async (req, res) => {
        const result = await bento.namespace("api").getOrSet({
            key: "dashboard",
            ttl: 60 * 60 * 24,
            factory: async () => {
                const stmt = await db.prepare(dashboard_sql)
                return await stmt.all()
            }
        })

        logger.debug(`dashboard result count ${result.length}`)
        res.json(result)
    })
    app.get('/api/chart', async (req, res) => {
        const result = await bento.namespace("api").getOrSet({
            key: "chart",
            ttl: 60 * 60 * 24,
            factory: async () => {
                const stmt = await db.prepare(dashboard_chart_sql)
                return await stmt.all()
            }
        })
        logger.debug(`chart result count ${result.length}`)
        res.json(result)
    })
    app.post('/api/search', async (req, res) => {
        const result = await bento.namespace("api").getOrSet({
            key: `chart-${req.body.from}-${req.body.to}`,
            ttl: 60 * 60 * 24,
            factory: async () => {
                const stmt = await db.prepare(date_range_sql)
                await stmt.bind(req.body.from, req.body.to)
                return await stmt.get()
            }
        });
        logger.debug(`search result from ${req.body.from} to ${req.body.to}:: count ${result.length}`)
        res.json(result)
    })
    app.get('/', async (req, res) => {
        res.render('index', {})
    })

    app.listen(port, () => {
        logger.warn(`AMPD Energy:: Dashboard :: listening on port ${port}`)
    })
})
