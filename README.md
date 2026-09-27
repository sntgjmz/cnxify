# CNXify

CNXify is a private music library for Concentrix colleagues. It has a Vite/React client and an Express, PostgreSQL, and Socket.IO server.

## Local setup

1. Copy `server/.env.example` to `server/.env`, provide `DATABASE_URL` and a long random `JWT_SECRET`, and set your own company address in `ADMIN_EMAILS`.
2. Create the database schema with `psql "$DATABASE_URL" -f server/schema.sql`.
3. Run `npm --prefix server run dev` and `npm --prefix client run dev`.

The configured `ADMIN_EMAILS` addresses are approved administrators on registration. Other company accounts are pending until an administrator approves them in the Admin Portal. For an existing database, approve the intended administrator once with:

```sql
UPDATE users SET role = 'ADMIN', status = 'APPROVED' WHERE email = 'your.name@concentrix.com';
```

## Deployment configuration

Set `VITE_API_URL` in the client environment to the public backend URL, with no trailing slash. Set `CLIENT_ORIGINS` in the server environment to a comma-separated list of exact frontend origins. The server requires `JWT_SECRET`; it intentionally will not start with a fallback secret.
