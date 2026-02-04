# FLP Blank Page After Activation

## Symptoms
- Fiori Launchpad loads but shows a blank/white page.
- Browser shows empty shell or missing UI frame after activation.

## Likely causes
- UI2 services not active or incomplete activation.
- ICF service errors or missing authorizations.
- Theme or UI resources failing to load.

## Checks
- Verify UI2 services are active in SICF (for example /UI2/*).
- Review ICF/HTTP error logs and browser console errors.
- Confirm user can access Launchpad without 401/403 errors.

## Fix / next actions
- Re-run activation steps if services are missing or inactive.
- Clear browser cache and retest with a clean session.
- Validate roles and authorizations for Launchpad access.

## Escalation info
- Share browser console errors, HTTP status codes, and ICF log entries.
- Provide client, system, and user details for trace analysis.
