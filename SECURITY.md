# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Girify seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed

### How to Report

Please report security vulnerabilities by emailing:

**Email**: [Your email here - replace with actual email]

You can also use GitHub's private vulnerability reporting feature:

1. Go to the repository's "Security" tab
2. Click "Report a vulnerability"
3. Fill out the form with details

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**
- **Initial Assessment**: We will provide an initial assessment within **5 business days**
- **Status Updates**: We will keep you informed about our progress every **7 days**
- **Resolution**: We aim to resolve critical vulnerabilities within **30 days**

### What to Expect

After you submit a report, we will:

1. **Confirm** the vulnerability and determine its severity
2. **Develop** a fix for the vulnerability
3. **Test** the fix thoroughly
4. **Release** a security update
5. **Credit** you in our security advisories (if you wish)

## Security Update Process

### For Users

When a security update is released:

1. We will publish a security advisory on GitHub
2. The fix will be included in a new release
3. Update instructions will be provided in the release notes
4. Critical vulnerabilities will be announced via GitHub notifications

### For Contributors

If you're contributing code:

- Follow secure coding practices
- Run `npm audit` regularly to check for vulnerable dependencies
- Use environment variables for sensitive data (never commit secrets)
- Enable two-factor authentication on your GitHub account
- Review our [Contributing Guidelines](CONTRIBUTING.md) for security requirements

## Security Best Practices

### For Developers

- **Dependencies**: Keep dependencies up to date (`npm audit fix`)
- **Secrets**: Never commit API keys, passwords, or tokens
- **Environment Variables**: Use `.env` files (already in `.gitignore`)
- **Authentication**: Use Firebase Authentication (already implemented)
- **Input Validation**: Validate and sanitize all user inputs
- **HTTPS**: Always use HTTPS in production (Vercel handles this)

### For Users

- **Updates**: Keep your deployment up to date with the latest version
- **API Keys**: Rotate Firebase API keys if exposed (see `security_remediation.md`)
- **Access Control**: Use Firebase security rules to protect data
- **Monitoring**: Monitor Firebase console for unusual activity

## Known Security Considerations

### Firebase API Keys

Firebase API keys in the client are **public by design** and safe to expose. Security is enforced through:

- Firebase Security Rules (Firestore, Storage)
- Firebase Authentication
- Authorized domains configuration

However, if you suspect your API key has been compromised:

1. Create a new Firebase web app
2. Update environment variables
3. Delete the old app
4. See `security_remediation.md` for detailed steps

### Data Privacy

- User data is stored in Firebase Firestore
- Authentication is handled by Firebase Auth
- No sensitive data is stored in localStorage (only username and preferences)
- All data transmission uses HTTPS

## Security Hall of Fame

We appreciate security researchers who help keep Girify safe. Contributors who responsibly disclose vulnerabilities will be credited here (with permission):

<!--
Example format:
- **[Researcher Name](https://github.com/username)** - Discovered XSS vulnerability (Fixed in v1.0.1)
-->

_No security vulnerabilities have been reported yet._

## Additional Resources

- [GitHub Security Advisories](https://github.com/USERNAME/REPO/security/advisories)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Remediation Guide](/.gemini/antigravity/brain/9682c9a7-5671-4cd8-b3ab-aac7b8abaf60/security_remediation.md)

## Contact

For security-related questions or concerns:

- **Security Issues**: [Email - replace with actual]
- **General Questions**: Open a GitHub Discussion
- **Non-Security Bugs**: Open a GitHub Issue

---

**Last Updated**: January 2, 2026
