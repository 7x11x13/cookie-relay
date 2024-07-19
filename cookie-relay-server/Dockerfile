FROM golang:1.22 as builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /cookie-relay-server

FROM alpine:3.20 as runtime

WORKDIR /

COPY --from=builder /cookie-relay-server /cookie-relay-server

ENV ADDR=0.0.0.0:80

EXPOSE 80

RUN addgroup \
    --gid 1001 \
    appgroup \
    &&  adduser \
    --disabled-password \
    --gecos "" \
    --ingroup appgroup \
    --no-create-home \
    --uid 1001 \
    appuser

USER appuser

ENTRYPOINT [ "/cookie-relay-server" ]