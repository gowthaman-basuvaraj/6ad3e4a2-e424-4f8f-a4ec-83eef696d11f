import dotenv from 'dotenv'
import express from 'express'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import pino from 'pino'


dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const logger = pino()

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
                       group by month`

const date_range_sql = `select sum(carbon_saved) as carbon_saved,
                               sum(fueld_saved)  as fueld_saved
                        from device_saving
                        where timestamp > ?
                          and timestamp < ?`

get_db().then(db => {

    app.get('/api/dashboard', async (req, res) => {
        const stmt = await db.prepare(dashboard_sql)
        let result = await stmt.all()
        logger.debug(`dashboard result count ${result.length}`)
        res.json(result)
    })
    app.post('/api/search', async (req, res) => {
        const stmt = await db.prepare(date_range_sql)
        await stmt.bind(req.body.from, req.body.to)
        let result = await stmt.all()
        logger.debug(`search result from ${req.body.from} to ${req.body.to}:: count ${result.length}`)
        res.json(result)
    })
    app.get('/', async (req, res) => {
        res.render('index', {title: 'Hey', message: 'Hello there!'})
    })

    app.listen(port, () => {
        logger.warn(`AMPD Energy:: Dashboard :: listening on port ${port}`)
    })
})
