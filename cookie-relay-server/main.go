package main

import (
	"os"

	"github.com/7x11x13/cookie-relay/cookie-relay-server/db"
	"github.com/7x11x13/cookie-relay/cookie-relay-server/middleware"
	"github.com/7x11x13/cookie-relay/cookie-relay-server/routes"
	"github.com/gin-gonic/gin"
)

func main() {
    // Env vars:
    // ENV, ADDR, REDIS_URL, APIKEY
    if os.Getenv("ENV") == "PRODUCTION" {
		gin.SetMode(gin.ReleaseMode)
	}
    db.InitRedis(os.Getenv("REDIS_URL"))

    r := gin.Default()

    // Middleware
    middleware.InitAPIKeyAuth(os.Getenv("APIKEY"))
    r.Use(middleware.APIKeyAuth())

    // Routes
    routes.InitRoutes(r)

    r.Run(os.Getenv("ADDR"))
}