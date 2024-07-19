package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/7x11x13/cookie-relay/cookie-relay-server/db"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type Cookie struct {
	domain           string
	expirationDate   int64
	firstPartyDomain string
	hostOnly         bool
	httpOnly         bool
	name             string
	path             string
	secure           bool
	session          bool
	sameSite         string
	value            string
}

func InitRoutes(r *gin.Engine) {
	r.GET("/cookies/:website/:userId", GetCookies)
	r.POST("/cookies/:website/:userId", SetCookies)
}

func GetCookies(ctx *gin.Context) {
	website := ctx.Param("website")
	userId := ctx.Param("userId")
	key := fmt.Sprintf("cookies:%s:%s", website, userId)
	json_str, err := db.Redis.Get(ctx, key).Result()
	if err == redis.Nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	} else if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	var cookies []Cookie
	err = json.Unmarshal([]byte(json_str), &cookies)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, cookies)
}

func SetCookies(ctx *gin.Context) {
	var cookies []Cookie
	err := ctx.BindJSON(&cookies)
	if err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	json, err := json.Marshal(cookies)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	website := ctx.Param("website")
	userId := ctx.Param("userId")
	key := fmt.Sprintf("cookies:%s:%s", website, userId)
	db.Redis.Set(ctx, key, string(json), 0).Result()
}