# 🔒 Security Guidelines - OnTest

This document outlines important security considerations for OnTest deployment and usage.

## 🚨 Environment Variables Security

### ⚠️ NEVER COMMIT SENSITIVE DATA

**DO NOT** commit these files to version control:
- `.env`
- `.env.local`
- `.env.production`
- Any file containing real credentials

### ✅ Safe Practices

1. **Use .env.example**
   - Only commit `.env.example` with placeholder values
   - Never include real credentials in example files

2. **Generate Strong Secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate CRON_SECRET (if needed)
   openssl rand -hex 32
   ```

3. **Secure Database Credentials**
   - Use strong passwords for database users
   - Limit database user permissions
   - Use SSL connections in production

## 🔐 Google OAuth Security

### Setup Best Practices

1. **Authorized Domains**
   - Only add domains you control
   - Remove localhost URLs in production

2. **Redirect URIs**
   - Use HTTPS in production
   - Validate all redirect URIs
   - Remove development URLs from production

3. **Client Secret Protection**
   - Never expose client secrets in frontend code
   - Rotate secrets regularly
   - Use environment variables only

## 🛡️ Production Security

### Environment Variables

```env
# Production example (use your own values)
DATABASE_URL="postgresql://user:secure_password@your-db-host:5432/your_db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-generated-secret"
GOOGLE_CLIENT_ID="your-production-client-id"
GOOGLE_CLIENT_SECRET="your-production-client-secret"
```

### Security Headers

Ensure your deployment includes:
- HTTPS enforcement
- Secure cookie settings
- CSRF protection (built into NextAuth.js)
- Content Security Policy

### Database Security

1. **Connection Security**
   - Use SSL/TLS connections
   - Whitelist IP addresses
   - Use connection pooling

2. **User Permissions**
   - Create dedicated database user
   - Grant minimal required permissions
   - Avoid using superuser accounts

## 🔍 Security Checklist

### Development
- [ ] `.env` file is in `.gitignore`
- [ ] No real credentials in code
- [ ] Google OAuth configured for localhost
- [ ] Database uses strong password

### Production
- [ ] All URLs use HTTPS
- [ ] Environment variables are secure
- [ ] Google OAuth configured for production domain
- [ ] Database connections use SSL
- [ ] Secrets are rotated regularly
- [ ] Monitoring and logging enabled

## 🚨 Security Incident Response

If you suspect a security breach:

1. **Immediate Actions**
   - Rotate all secrets immediately
   - Check access logs
   - Disable compromised accounts

2. **Investigation**
   - Review recent changes
   - Check for unauthorized access
   - Document the incident

3. **Recovery**
   - Update all credentials
   - Patch vulnerabilities
   - Notify affected users if necessary

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns privately
3. Provide detailed information about the vulnerability
4. Allow time for investigation and patching

## 🔄 Regular Security Maintenance

### Monthly Tasks
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Check for security advisories

### Quarterly Tasks
- [ ] Rotate secrets and passwords
- [ ] Review user permissions
- [ ] Update security documentation

### Annual Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review and update security policies

---

**Remember**: Security is an ongoing process, not a one-time setup. Stay vigilant and keep your systems updated!
