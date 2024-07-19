package db

import (
	"github.com/redis/go-redis/v9"
)

var Redis *redis.Client

func InitRedis(url string) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		panic(err)
	}
	Redis = redis.NewClient(opts)
}