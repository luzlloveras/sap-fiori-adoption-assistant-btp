# OData 401/403 Troubleshooting

## Symptoms
- OData service calls return 401 Unauthorized or 403 Forbidden.
- Launchpad tiles fail to load data.

## Likely causes
- Missing authorizations for the service or backend user.
- Gateway configuration or system alias issues.
- Incomplete role assignment for OData access.

## Checks
- Review /IWFND/ERROR_LOG entries for the service.
- Run SU53 or authorization trace for the user.
- Verify the OData service and system alias configuration.

## Fix / next actions
- Update roles and authorization objects as required.
- Re-test the service call after role changes.
- Confirm the service is active and reachable.

## Escalation info
- Share error log entries, HTTP status codes, and trace results.
- Provide service name, user, and client details.
