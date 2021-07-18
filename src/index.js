const express = require(`express`)
const helmet = require(`helmet`)
const cors = require(`cors`)
const compression = require(`compression`)
const { Logging } = require(`@google-cloud/logging`)

const { version } = require('../package.json')

// NOTE: 32mb is limit by Cloud Run and is generally a sane limit, but feel free to increase this
const { BODY_LIMIT = `32mb`, NODE_ENV = `production`, PORT = 8080, GCLOUD_PROJECT_ID } = process.env

const app = express()

const logging = new Logging({
    projectId: GCLOUD_PROJECT_ID
})
const log = logging.log(`sawmill`)

app.use(helmet())

// NOTEs on settings origin
// Set this to your known web origin such as dashboard.vikramtiwari.com etc
// If you are using an app then you should not rely on this and instead use API keys
app.use(cors({ origin: true })) // TODO: Update this to known origins

app.use(express.json({ limit: BODY_LIMIT }))
app.use(compression())

app.set(`trust proxy`, true)

app.get(`/_healthz`, (req, res) => {
    res.status(200).send(req.query)
})

app.get(`/`, (req, res) => {
    res.status(200).send(`Sawmill active! Post messages to ingest.`)
})

// From: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
const severityMap = Object.freeze({
    // no need to add default, it's default
    debug: `DEBUG`,
    info: `INFO`,
    notice: `NOTICE`,
    warn: `WARNING`,
    error: `ERROR`,
    critical: `CRITICAL`,
    alert: `ALERT`,
    emergency: `EMERGENCY`
})

function addLog(msg) {
    const metadata = {
        timestamp: msg.timestamp || new Date().toISOString(),
        resource: {
            type: `global`,
            labels: { project_id: GCLOUD_PROJECT_ID }
        }
    }

    if (msg.level) metadata.severity = severityMap[msg.level]

    const entry = log.entry(metadata, msg)
    log.write(entry)
    if (NODE_ENV !== `production`) console.log(entry)
}

app.post(`/`, (req, res) => {
    try {
        if (typeof req.body !== `object`) {
            return res.status(400).json({
                name: `Malformed request`,
                message: `req.body should be an object.`
            })
        }

        const server = {
            ip: req.headers[`x-forwarded-for`] || req.socket.remoteAddress,
            version
        }

        const logs = Array.isArray(req.body) ? req.body : [req.body]
        logs.forEach(entry => addLog({ ...entry, ...server }))

        res.status(200).send()
    } catch (error) {
        console.error(error)
    }

})


app.listen(PORT, () => {
    console.log(`Sawmill ready at port ${PORT}.`)
})