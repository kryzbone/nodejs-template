require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app)
const cors = require('cors')
const requestLogger = require('morgan')
const mongoose = require("mongoose");
const { authorise } = require("./src/utils/authorization")
const routes =  require("./src/routes");
const generateAPIDocs = require("./src/utils/docs");
const { formatLoggerResponse, logger } = require("./src/utils/logger");

const port = process.env.PORT || 5000


//mongo db and server setup
mongoose.connect(process.env.MONGO_URI)
.then(() => { 
    console.log("DB Connected")
    server.listen(port, () => console.log("server is live on " + port))
})
.catch(err => console.log(err))

// express middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// logger
app.use(requestLogger('combined'));

// authentication middleware
app.use(authorise)

// api Docs
generateAPIDocs(app)

// api routes
app.use("/api", routes)

//404 handler
app.use((req, res, next) => {
    const err = new Error("Page Not Found")
    err.status = 404;
    next(err)
})

//error handling
app.use((err, req, res, next) => {
    // Logger
    logger.error('Error', 
        formatLoggerResponse(req, res, 
            {...err, message: err.message || err.error?.message || "Oops Something went wrong!"}
        )
    )

    res.status(err.status || 500).json({
        error: {
            message: err.message || err.error?.message || "Oops Something went wrong!"
        }
    })
})

