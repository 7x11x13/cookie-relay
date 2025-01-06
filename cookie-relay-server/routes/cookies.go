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
	Domain           string             `json:"domain"`
	ExpirationDate   int64              `json:"expirationDate"`
	FirstPartyDomain string             `json:"firstPartyDomain,omitempty"`
	HostOnly         bool               `json:"hostOnly"`
	HttpOnly         bool               `json:"httpOnly"`
	Name             string             `json:"name"`
	PartitionKey     CookiePartitionKey `json:"partitionKey,omitempty"`
	Path             string             `json:"path"`
	Secure           bool               `json:"secure"`
	Session          bool               `json:"session"`
	SameSite         string             `json:"sameSite"`
	StoreId          string             `json:"storeId"`
	Value            string             `json:"value"`
}

func InitRoutes(r *gin.Engine) {
	r.GET("/cookies/:website/:userId", GetCookies)
	r.GET("/cookies/:website/:userId/:cookieName", GetCookie)
	r.POST("/cookies/:website/:userId", SetCookies)
}

func GetCookie(ctx *gin.Context) {
	website := ctx.Param("website")
	userId := ctx.Param("userId")
	cookieName := ctx.Param("cookieName")
	key := fmt.Sprintf("cookies:%s:%s", website, userId)
	if db.Redis.Exists(ctx, key).Val() == 0 {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	json_str, err := db.Redis.JSONGet(ctx, key, cookieName).Result()
	if err == redis.Nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	} else if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	var cookie Cookie
	err = json.Unmarshal([]byte(json_str), &cookie)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, cookie)
}

func GetCookies(ctx *gin.Context) {
	website := ctx.Param("website")
	userId := ctx.Param("userId")
	key := fmt.Sprintf("cookies:%s:%s", website, userId)
	if db.Redis.Exists(ctx, key).Val() == 0 {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	json_str, err := db.Redis.JSONGet(ctx, key).Result()
	if err == redis.Nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	} else if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	var cookies map[string]Cookie
	err = json.Unmarshal([]byte(json_str), &cookies)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	arr := []Cookie{}
	for _, cookie := range cookies {
		arr = append(arr, cookie)
	}
	ctx.JSON(http.StatusOK, arr)
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
	website := ctx.Param("website")
	userId := ctx.Param("userId")
	key := fmt.Sprintf("cookies:%s:%s", website, userId)
	if db.Redis.Exists(ctx, key).Val() == 0 {
		_, err := db.Redis.JSONSet(ctx, key, "$", "{}").Result()
		if err != nil {
			ctx.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}
	for _, cookie := range cookies {
		_, err = db.Redis.JSONSet(ctx, key, cookie.Name, cookie).Result()
		if err != nil {
			ctx.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}
}
