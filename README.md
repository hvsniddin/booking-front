# Booking frontend

Vite/React frontend for the appointment booking system. The app is served at `/app/`, and the static landing page is served at `/landing/`. Requests to `/api/` go to the backend.

## Local development

```sh
npm ci
npm run dev
```

Vite runs on port 3000 and proxies `/api/` to `http://localhost:8000`.

## Docker

```sh
docker build -t booking-frontend .
docker run --rm -p 8080:80 --network <backend-network> \
  -e API_UPSTREAM=http://api:8000 booking-frontend
```

Open `http://localhost:8080/`. The root redirects to the landing page; app routes, including deep links, work under `/app/`. Set `API_UPSTREAM` to the backend's URL as reachable **from the container**. Its default is `http://api:8000`, which assumes a backend container named `api` on the same Docker network. The frontend image does not include the backend.

## GitHub Container Registry

A push to `master` runs [the container workflow](.github/workflows/container.yml). It builds and publishes `ghcr.io/<owner>/<repository>:latest` and a commit SHA tag. The workflow can also be started manually. It uses the repository's `GITHUB_TOKEN` with `packages: write`, so no separate registry secret is needed. Check the repository's Actions and package permissions if publishing is denied.
