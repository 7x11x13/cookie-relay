package middleware

import (
	"context"

	"github.com/7x11x13/cookie-relay/cookie-relay-server/db"
	"github.com/gin-gonic/gin"
)

func InitAPIKeyAuth(keys ...string) {
	_, err := db.Redis.SAdd(context.Background(), "apikeys", keys).Result()
	if err != nil {
		panic(err)
	}
}

func APIKeyAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		key := ctx.Request.Header.Get("Cookie-Relay-API-Key")
		if key == "" {
			ctx.AbortWithStatus(401)
			return
		}
		valid, err := db.Redis.SIsMember(ctx, "apikeys", key).Result()
		if err != nil {
			ctx.AbortWithError(500, err)
			return
		}
		if !valid {
			ctx.AbortWithStatus(401)
			return
		}
		ctx.Next()
	}
}