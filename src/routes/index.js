const router = require("express").Router()
const authRoutes  = require("../controllers/auth")
const userRoutes = require("../controllers/users")


router.use("/auth", authRoutes)
router.use("/users", userRoutes)


module.exports = router