# Fiori Launchpad Troubleshooting Overview

## Start broad: apps not visible, HTTP 401, HTTP 403, blank page

Begin by confirming the user, client, and role assignment. Then check catalogs, spaces, and pages. For HTTP 401/403 in Fiori Launchpad or OData, add authorization and SICF checks.

## When you get Error 403 or 401 in Fiori Launchpad

- Error 403 al abrir Fiori Launchpad often means authorization or OData/service access.
- HTTP 401 in Fiori Launchpad or on OData points to missing or wrong credentials/roles.
- Launchpad 403 after activation can be UI2 services or authorization.

## When apps are not visible in Fiori

- Apps not visible in Launchpad: check business role, catalog, space/page, target mappings, cache.
- If only specific apps are missing, focus on target mappings and authorizations for those apps.
- Consider personalization, client mismatch, and system alias.

## Checks (high level)

- User, client, system alias, business role, PFCG role.
- Catalog, space, page, target mappings.
- Authorization trace if 401/403 or app not visible.
- SICF/UI2 if Launchpad blank page or activation issues.

## Escalation

If standard checks pass, request logs and authorization traces from basis or security teams.
