# UI2 Services Missing or 404 in Fiori Launchpad (SICF Activation)

## When you get UI2 services 404 or Fiori activation issues

If the Fiori Launchpad does not load or returns 404/403 after activation, the UI2 services in SICF may be missing or inactive.

## Symptoms

- Fiori Launchpad does not load or returns errors after activation.
- Requests to /UI2/* return 404 or HTTP 403.
- UI2 services 404 when opening Launchpad.

## Likely causes

- UI2 services not activated in SICF.
- Activation task incomplete or not executed in the correct client.
- System alias or client mismatch after Fiori activation.

## Checks

- Confirm /UI2/* services are active in SICF.
- Verify activation report was executed (for example FLP_ACTIVATE_SERVICES or ACTIVATE_FLP).
- Check system alias and client assignments used by Launchpad.
- Ensure no HTTP 401/403 on /UI2/* when opening Fiori Launchpad.

## Fix / Next actions

- Activate missing UI2 services in SICF.
- Re-run activation tasks in the correct client.
- Validate user roles for Launchpad access.
- Re-run /UI2/FLP_ACTIVATE_SERVICES or /UI2/ACTIVATE_FLP if needed.

## Escalation information

- Provide list of inactive UI2 services and client details.
- Include activation logs or errors from the activation report.
- Share any HTTP 404/403 responses for /UI2/*.
