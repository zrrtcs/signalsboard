# Security & Secret Management

## Current Setup (Development)

For local development, we use `.env` files (excluded from source control):
- Copy `.env.example` to `.env`  
- Set secure passwords locally
- Environment variables automatically loaded by docker-compose

## Production Secret Management

**NEVER use .env files in production.** Instead, use proper secret management:

### Docker Swarm - Docker Secrets
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    secrets:
      - postgres_password

secrets:
  postgres_password:
    external: true
```

Create secrets:
```bash
echo "secure_password" | docker secret create postgres_password -
```

### Azure Container Instances - Key Vault
```yaml
# Use Azure Key Vault integration
environment:
  - name: ConnectionStrings__DefaultConnection
    secureValue: "@Microsoft.KeyVault(SecretUri=https://vault.vault.azure.net/secrets/db-connection/)"
```

### Kubernetes - Secrets & External Secrets Operator
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
data:
  password: <base64-encoded-password>
```

### AWS ECS - Parameter Store/Secrets Manager
```yaml
environment:
  - name: POSTGRES_PASSWORD
    valueFrom: 
      secretArn: arn:aws:secretsmanager:region:account:secret:postgres-password
```

### Other Production Options
- **HashiCorp Vault** - Enterprise secret management
- **Google Secret Manager** - GCP native solution  
- **CI/CD injection** - Inject secrets during deployment
- **Init containers** - Fetch secrets before app startup

## Security Best Practices

1. **Rotate secrets regularly** (every 30-90 days)
2. **Use least privilege access** - only necessary services get secrets
3. **Audit secret access** - track who/when/what accessed
4. **Encrypt secrets at rest** - all production secret stores should encrypt
5. **Network isolation** - secrets should be transmitted over encrypted channels
6. **Emergency revocation** - ability to immediately disable compromised secrets

## Local Development Security

1. **Never commit .env files** - already in .gitignore
2. **Use different credentials** than production
3. **Regularly rotate dev credentials** 
4. **Don't share .env files** - each developer creates their own
5. **Use minimal permissions** - dev databases don't need production access

## Monitoring & Alerting

Set up alerts for:
- Failed authentication attempts
- Unusual database access patterns  
- Secret rotation failures
- Unauthorized secret access attempts

This ensures the hospital dashboard maintains security standards suitable for healthcare data.