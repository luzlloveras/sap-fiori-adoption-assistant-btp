# Apps Not Visible in Fiori Launchpad – Checklist

## When apps are not visible in Fiori Launchpad

Use this checklist when the user reports apps not visible in Launchpad, missing tiles, or wrong set of apps. Covers role, catalog, space/page, target mapping, cache, authorization, and client/system alias.

## Symptoms

- Apps not visible in Launchpad; user sees empty or partial tile set.
- Tiles missing in Fiori Launchpad for one or more users.
- Launchpad loads but specific apps do not appear.

## Checks

- User has the correct business role assigned (and in the correct client).
- Business role includes the needed catalog.
- Space/page assignments are active for that role.
- Target mappings exist for the apps in the catalog.
- No client mismatch or wrong system alias.
- Cache has been cleared or session restarted.
- For HTTP 401/403 when opening an app: run authorization trace; check OData/service.
- For Launchpad blank page: check UI2/SICF and activation; see flp-blank-page-after-activation.

## Fix / Next actions

- Fix role, catalog, space/page, or target mapping as needed.
- Clear Launchpad cache and re-test with fresh session.
- If 401/403: fix authorizations and re-test.
- If still apps not visible: collect logs and authorization traces for escalation.

## Escalation information

- If all checks pass and apps are still missing: collect user, client, system alias, role names, and authorization trace (and /IWFND/ERROR_LOG if OData 401/403).
