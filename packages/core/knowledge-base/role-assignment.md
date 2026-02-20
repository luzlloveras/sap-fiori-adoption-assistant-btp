# Business Role and PFCG Assignment – Apps Not Visible in Fiori Launchpad

## When tiles or apps are missing: role and PFCG

Users need the correct business role assignment for Fiori Launchpad. The business role typically references one or more PFCG roles that grant authorizations. Missing or wrong assignment leads to apps not visible in Launchpad.

## Symptoms

- User can authenticate but does not see any tiles in Fiori Launchpad, or sees a partial set of apps.
- Apps not visible in Launchpad after role change.
- HTTP 401 or 403 in Launchpad when authorization is missing for a service.

## Likely causes

- Business role not assigned to the user.
- PFCG role not generated or not assigned.
- Client mismatch: role assigned in one client, user testing in another.
- System alias or backend system not aligned with role.

## Checks

- Confirm the business role is assigned to the user in the correct client.
- Confirm the underlying PFCG role is generated and assigned.
- Ask for the exact user ID, client, and role name used in the assignment.
- Verify system alias and target mapping for Launchpad.

## Fix / Next actions

- Assign or correct business role and PFCG role.
- Re-generate PFCG role if needed.
- Re-test in the correct client with same user ID and system alias.

## Escalation information

- Provide user ID, client, business role name, PFCG role name, and system alias.
