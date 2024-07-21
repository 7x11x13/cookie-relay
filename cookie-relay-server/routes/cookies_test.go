package routes

import "testing"

func TestCookiesFromJSON(t *testing.T) {
	data := []byte("[{\"name\":\"oauth_token\",\"value\":\"token\""+
	",\"domain\":\"soundcloud.com\",\"hostOnly\":true,\"path\":\""+
	"/\",\"secure\":true,\"httpOnly\":false,\"sameSite\":\"no_restriction\""+
	",\"session\":false,\"firstPartyDomain\":\"\",\"partitionKey\":null"+
	",\"expirationDate\":1749351036,\"storeId\":\"firefox-default\"}]")
	cookies, err := cookiesFromJSON(data)
	if err != nil {
		t.Fatalf("%v", err)
	}
	if len(cookies) != 1 {
		t.Fatalf("Expected 1 cookie, got: %d", len(cookies))
	}
	cookie := cookies[0]
	if cookie.Domain != "soundcloud.com" {
		t.Fatalf("Expected domain: soundcloud.com, got: %s", cookie.Domain)
	}
	if cookie.Name != "oauth_token" {
		t.Fatalf("Expected name: oauth_token, got: %s", cookie.Name)
	}
}