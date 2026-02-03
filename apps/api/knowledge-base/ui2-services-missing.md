# UI2 Services Missing or Inactive

## Symptoms
- Launchpad does not load or returns errors after activation.
- Requests to /UI2/* return 404 or 403.

## Likely causes
- UI2 services not activated in SICF.
- Activation task incomplete or not executed in the correct client.
- System alias or client mismatch.

## Checks
- Confirm /UI2/* services are active in SICF.
- Verify activation report was executed (for example FLP_ACTIVATE_SERVICES).
- Check system alias and client assignments used by Launchpad.

## Fix / next actions
- Activate missing UI2 services in SICF.
- Re-run activation tasks in the correct client.
- Validate user roles for Launchpad access.

## Escalation info
- Provide list of inactive services and client details.
- Include activation logs or errors from the activation report.
