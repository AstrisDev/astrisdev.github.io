# Set the following environment variables when running the backend image: 
# GITHUB_TOKEN=
# GITHUB_REPOSITORY= (например, username/repo-name)
# GITHUB_PAGES_BRANCH=gh-pages

# -----------------
# Frontend builder
# -----------------

FROM node:19 AS frontend-builder
COPY frontend /frontend
RUN cd /frontend && npm install && npm run build

# -----------------
# Backend
# -----------------

FROM golang:1.21.3-bullseye as builder
COPY tools/ /app
RUN --mount=type=cache,target=/root/.cache/go-build \
    cd /app && go build -buildvcs=false ./cmd/sfwatch

FROM ubuntu:22.04 AS backend
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy app binaries
RUN mkdir -p /app/bin
COPY --from=builder /app/sfwatch /app/bin/sfwatch

# Copy frontend files
COPY --from=frontend-builder /frontend/dist /app/frontend

VOLUME ["/app/storage"]
ENTRYPOINT ["/app/bin/sfwatch", "-r", "/app/storage", "-f", "/app/frontend", "-d", "git -C {{ .PagesPath }} init && git -C {{ .PagesPath }} config user.name 'GitHub Actions' && git -C {{ .PagesPath }} config user.email 'actions@github.com' && git -C {{ .PagesPath }} add . && git -C {{ .PagesPath }} commit -m 'Deploy to GitHub Pages' && git -C {{ .PagesPath }} push -f https://$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git HEAD:$GITHUB_PAGES_BRANCH"] 