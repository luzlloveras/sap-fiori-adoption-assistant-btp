# Client Mismatch and System Alias – Fiori Launchpad and Apps Not Visible

## Why client and system alias matter for Fiori Launchpad

Access issues can stem from using the wrong client or system alias, or testing with a different user than expected. Causes apps not visible in Launchpad, HTTP 401/403, or wrong catalog/target mapping. Client mismatch is a frequent root cause.

## Symptoms

- Apps not visible in Fiori Launchpad in one client but visible in another.
- HTTP 401 or 403 when Launchpad or OData uses wrong system alias.
- Role assigned in one client; user tests in another (client mismatch).
- Target mapping points to wrong system or client.

## Checks

- Confirm the client number where the role assignment was done.
- Verify the system alias used in the target mapping for Launchpad.
- Ensure the user ID matches the one that received the role.
- Check that Launchpad and OData use the same system alias and client as where roles are valid.
- No client mismatch between basis configuration and user test.

## Fix / Next actions

- Use correct client and system alias for testing.
- Align target mapping and system alias with role assignment client.
- Re-test Fiori Launchpad and app visibility after fixing client/system alias.
- Document client and system alias for escalation.

## Escalation information

- Provide client, system alias, user ID, and where role was assigned (client/system).
