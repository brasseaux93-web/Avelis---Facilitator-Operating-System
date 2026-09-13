# Production KMS

The local stub is a development object. Production boot refuses it, and refuses
placeholder `LOCAL_DEV_*` / JWT / room secrets.

Required — pick one:

AWS:

```
NODE_ENV=production
KMS_PROVIDER=aws
AWS_REGION=...
AWS_KMS_KEY_ID=arn:...
AWS_KMS_SIGNING_KEY_ID=arn:...
```

Vault Transit:

```
NODE_ENV=production
KMS_PROVIDER=vault
VAULT_ADDR=https://vault.example
VAULT_TOKEN=...
VAULT_TRANSIT_KEY=avelis
```

`GET /api/health/security` reports provider and isolation. It never returns secret values.

`assertProductionKms()` runs at API boot. Speech still never enters KMS — only process keys and destruction signatures do.
