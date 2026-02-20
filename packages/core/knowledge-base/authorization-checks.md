# Authorization Checks – HTTP 401, 403, and Apps Not Visible in Fiori Launchpad

## When to run authorization checks

If the user sees the Launchpad but not specific apps, or gets HTTP 401/403 in Fiori Launchpad or on OData, authorization checks can reveal missing objects or values. Error 403 al abrir Fiori Launchpad or OData 401 error often need SU53 or trace.

## When you get HTTP 401 or HTTP 403

- HTTP 401 in Fiori Launchpad or on OData: missing or wrong authorization.
- HTTP 403: forbidden; check authorization objects and PFCG role.
- Launchpad 403 after activation: can be UI2 or authorization.
- OData 401 error: run trace for the user and service; check /IWFND/ERROR_LOG.

## Practical approach

- Identify the missing app's target mapping and required authorizations.
- Run an authorization trace or SU53 for the user in the correct client.
- Compare required objects to the PFCG roles assigned.
- For OData 401/403, check service authorizations and backend user/role.
- Confirm no client mismatch or wrong system alias.

## Checks

- SU53 or authorization trace for the user.
- /IWFND/ERROR_LOG for OData 401/403.
- PFCG role and business role for Launchpad and app access.
- Client and system alias where role is valid.

## Fix / Next actions

- Add or fix authorization objects in PFCG role.
- Re-test Fiori Launchpad or OData after role change.
- If still 401/403, escalate with trace and error log.

## Escalation information

- Capture the failed authorization object, field, and value.
- Provide user, client, system alias, role names, and HTTP 401/403 context (Launchpad vs OData).
