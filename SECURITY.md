# Security Policy

## 🔒 Security Guidelines

### Environment Variables
- **NEVER** commit `.env` files to version control
- Store all sensitive data in environment variables
- Use `.env.example` as a template (with placeholder values only)
- Rotate API keys regularly

### Sensitive Data
The following should NEVER be committed to git:
- API keys and secrets
- Database passwords
- JWT secrets
- AWS credentials
- Any personal or production data

### Safe Practices
- Always use `.env.example` with placeholder values
- Keep `.env` in `.gitignore`
- Use different credentials for development/production
- Monitor API usage and set up alerts

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please:
1. **DO NOT** create a public issue
2. Email the maintainers directly
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## ✅ Security Checklist

Before deploying:
- [ ] `.env` is in `.gitignore`
- [ ] No secrets in code or config files
- [ ] All API keys are environment variables
- [ ] `.env.example` contains only placeholders
- [ ] Production uses different credentials than development