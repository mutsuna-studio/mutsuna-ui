# Security Policy

## Supported Versions

Security fixes are provided for the latest version of `@mutsuna/ui` published to npm. Older releases are not maintained unless the maintainers explicitly state otherwise.

## Reporting a Vulnerability

Do not report suspected vulnerabilities in a public issue, discussion, or pull request.

Use [GitHub Private Vulnerability Reporting](https://github.com/mutsuna-studio/mutsuna-ui/security/advisories/new) and include:

- the affected package version and public import path;
- a concise description of the impact and realistic attack path;
- reproduction steps or a minimal proof of concept;
- any known mitigations or workarounds.

Please avoid including secrets, personal data, production data, or unnecessary exploit detail. The maintainers will acknowledge the report as capacity permits, validate its impact, and coordinate remediation and disclosure with the reporter. Do not publicly disclose the issue until a fix or agreed disclosure plan is available.

## Scope

This policy covers:

- source and generated package contents published as `@mutsuna/ui`;
- public component, type, theme, CSS-variable, and SvelteKit integration contracts;
- build, test, release, GitHub Actions, npm Trusted Publishing, and provenance paths in this repository;
- vulnerabilities in direct or transitive dependencies when they create a realistic impact for this package or its consumers.

Consumer applications, their authorization rules, APIs, persistence, deployment configuration, and production data are outside this repository's boundary. Report those issues to the affected consumer project. A report is still welcome when the package violates its documented boundary or makes secure consumer use impractical.

## Security Invariants

- Untrusted pull requests must not obtain repository-write, npm-publish, deployment, secret, or OIDC authority.
- Published artifacts must originate from reviewed `main` content through the protected release workflow and npm Trusted Publishing.
- Public exports, rendered content, theme values, and component inputs must not introduce an undocumented code-execution or credential boundary.
- Security controls must fail closed when required release, provenance, or authorization context is unavailable.

## Out of Scope

The following are generally not treated as vulnerabilities without a concrete security impact:

- product-specific behavior that is intentionally owned by a consumer application;
- missing product authorization or validation that the package does not claim to provide;
- unsupported versions other than the latest published release;
- automated dependency or scanner output without a reachable package or release-path impact;
- social engineering, denial-of-service testing against shared services, or testing that affects other users.

These exclusions do not suppress a plausible vulnerability. If the boundary is unclear, report it privately and the maintainers will assess it.
