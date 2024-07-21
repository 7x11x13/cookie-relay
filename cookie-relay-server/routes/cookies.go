package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/7x11x13/cookie-relay/cookie-relay-server/db"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type CookiePartitionKey struct {
	TopLevelSite string `json:"topLevelSite"`
}

type Cookie struct {
	Domain           string `json:"domain"`
	ExpirationDate   int64  `json:"expirationDate"`
	FirstPartyDomain string `json:"firstPartyDomain,omitempty"`
	HostOnly         bool   `json:"hostOnly"`
	HttpOnly         bool   `json:"httpOnly"`
	Name             string `json:"name"`
	PartitionKey     CookiePartitionKey `json:"partitionKey,omitempty"`
	Path             string `json:"path"`
	Secure           bool   `json:"secure"`
	Session          bool   `json:"session"`
	SameSite         string `json:"sameSite"`
	StoreId          string `json:"storeId"`
	Value            string `json:"value"`
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

func cookiesFromJSON(jsonData []byte) ([]Cookie, error) {
	var cookies []Cookie
	err := json.Unmarshal(jsonData, &cookies)
	return cookies, err
}

func SetCookies(ctx *gin.Context) {
	body, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.AbortWithError(400, err)
		return
	}
	cookies, err := cookiesFromJSON(body)
	if err != nil {
		ctx.AbortWithError(400, err)
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