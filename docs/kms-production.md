# Production KMS

The local stub is a development object. Production boot refuses it.

Required:

```
NODE_ENV=production
KMS_PROVIDER=aws
AWS_REGION=...
AWS_KMS_KEY_ID=arn:...
AWS_KMS_SIGNING_KEY_ID=arn:...
```

Credentials come from the task role / instance profile. Do not embed long-lived
keys. `assertProductionKms()` runs at API boot. If any of the above is missing,
the process exits.

This is the operational boundary. Speech still never enters KMS — only process
keys and destruction signatures do.
