# Fiori Launchpad Blank Page After Activation (HTTP 401, 403, UI2, SICF)

## When you get Launchpad blank page or Error 403 after activation

Fiori Launchpad may show a blank page or white screen after activation. Often due to UI2 services not active in SICF, HTTP 401/403 on resources, or theme/ICF issues. Launchpad 403 after activation is a common symptom.

## Symptoms

- Fiori Launchpad loads but shows a blank/white page.
- Launchpad blank page after activation; browser shows empty shell or missing UI frame.
- HTTP 401 or HTTP 403 when opening Fiori Launchpad or loading UI2 resources.
- Error 403 al abrir Fiori Launchpad right after activation.

## Likely causes

- UI2 services not active or incomplete activation in SICF.
- ICF service errors or missing authorizations (401/403).
- Theme or UI resources failing to load (can return 403).
- System alias or client mismatch after activation.

## Checks

- Verify UI2 services are active in SICF (e.g. /UI2/*).
- Review ICF/HTTP error logs and browser console for 401/403.
- Confirm user can access Launchpad without HTTP 401/403 errors.
- Check /UI2/FLP_ACTIVATE_SERVICES or /UI2/ACTIVATE_FLP was run in correct client.
- Validate system alias and client for Launchpad.

## Fix / Next actions

- Re-run activation steps if UI2 services are missing or inactive.
- Activate missing /UI2/* services in SICF.
- Clear browser cache and retest with a clean session.
- Fix authorizations if HTTP 401/403 on Launchpad or UI2; validate roles.

## Escalation information

- Share browser console errors, HTTP 401/403 status codes, and ICF log entries.
- Provide client, system, system alias, and user details for trace analysis.
- List inactive UI2 services if any.
