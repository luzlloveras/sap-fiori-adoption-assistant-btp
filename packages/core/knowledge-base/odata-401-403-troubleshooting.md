# OData 401 / 403 and HTTP 401 HTTP 403 in Fiori Launchpad

## When you get OData 401 error or HTTP 403 in Fiori Launchpad

OData service calls can return HTTP 401 Unauthorized or HTTP 403 Forbidden. Launchpad tiles may fail to load data. Error 403 al abrir Fiori Launchpad or when opening an app often points to OData or service authorization.

## Symptoms

- OData service calls return 401 Unauthorized or 403 Forbidden.
- HTTP 401 on OData or HTTP 403 when opening Fiori Launchpad or an app.
- Launchpad tiles fail to load data; network shows 401/403.
- OData 401 error or Launchpad 403 after activation.

## Likely causes

- Missing authorizations for the OData service or backend user.
- Gateway configuration or system alias issues; client mismatch.
- Incomplete role assignment or PFCG for OData access.
- Service not active or wrong system alias.

## Checks

- Review /IWFND/ERROR_LOG entries for the OData service.
- Run SU53 or authorization trace for the user.
- Verify the OData service and system alias configuration.
- Confirm no client mismatch and correct PFCG role for the app.

## Fix / Next actions

- Update roles and authorization objects as required.
- Re-test the OData service call after role changes.
- Confirm the service is active and reachable; fix system alias if needed.
- Re-validate Launchpad access and app tile after authorization fix.

## Escalation information

- Share /IWFND/ERROR_LOG entries, HTTP 401/403 status codes, and SU53/trace results.
- Provide OData service name, user, client, and system alias.
