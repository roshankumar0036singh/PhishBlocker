# Contributing to PhishBlocker

We welcome contributions to PhishBlocker! To maintain high code quality and system integrity, please follow these professional standards.

## Code of Conduct

Maintain a professional, collaborative environment. Follow the project's technical direction and respect the established architecture.

## Development Workflow

1.  **Fork and Branch**: Create a feature branch from `main`.
2.  **Standards Compliance**:
    - **Python**: Adhere to PEP 8. Use typing hints for all function signatures.
    - **JavaScript/React**: Use functional components and hooks. Follow the established Tailwind CSS design tokens.
    - **Documentation**: Use professional technical language. Avoid the use of emojis in commit messages or documentation.
3.  **Atomic Commits**: Ensure each commit represents a single, logical change.
4.  **Testing**: Verify all changes with the existing test suite (`pytest` for backend, `npm test` for frontend).

## Technical Requirements

### Backend (API)
- All new endpoints must be documented with FastAPI/Swagger.
- Implement proper error handling and logging using the project's `logger`.
- Ensure any database or Redis interactions include robust exception handling.

### Frontend (Dashboard/Extension)
- Components should be modular and reusable.
- Maintain the "Night Ops" design system (glassmorphism, high-contrast emerald/red accents).
- Use Framer Motion for purposeful, professional micro-interactions.

## Pull Request Process

1.  Update the `CHANGELOG.md` (if present) or provide a clear summary of changes.
2.  Ensure your branch is rebased onto the latest `main`.
3.  Include verification steps and screenshots/vidoes for UI changes.

## Security Reporting

If you discover a security vulnerability, please do NOT open a public issue. Instead, email security@phishblocker.com.

---

**Thank you for contributing to the future of phishing detection.**
