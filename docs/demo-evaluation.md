# Evaluation demo (under two minutes)

Postgres must be up. `.env` needs `DATABASE_URL`. Mock KMS is local-dev only.

```
npm run demo:evaluation
```

Prints three links:

1. Facilitator console (session controls + process rail)
2. Party Alpha join code
3. Party Beta join code

Sign in with the seed facilitator. Parties have no accounts.

Eight-minute path: opening ritual → private turn with Alpha (Beta sees no payload) → return `Coverage on nights` → close. There is no transcript.

Partner packet:

```
npm run onboard:partner -- --name "Jordan Lee" --org "North Shore Mediation" --focus Employment --email jordan@example.com
```
