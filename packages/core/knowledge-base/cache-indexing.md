# Cache and Indexing – Apps Not Visible in Fiori Launchpad After Changes

## If apps are not visible after role or catalog update

Launchpad content can be cached. After role or catalog updates, users may need to log out and back in, or the cache must be refreshed. Stale indexing can make apps appear missing in Fiori Launchpad.

## Symptoms

- Apps not visible in Launchpad right after role/catalog change.
- Tiles appear for some users but not others; same role.
- Launchpad shows old set of apps until cache cleared.
- Content indexing stale; new catalog or tile not showing.

## Likely causes

- Launchpad cache not refreshed after role, catalog, or space/page change.
- Content indexing not updated; tile/target mapping index stale.
- Personalization or session cache hiding tiles.
- Client or system alias change without cache clear.

## Checks

- Clear Launchpad cache for the user or in the system.
- Rebuild content indexes if applicable for Fiori Launchpad.
- Test with a fresh user session (log out and back in).
- Confirm role/catalog/target mapping are correct before assuming cache.
- Check that no client mismatch or wrong system alias.

## Fix / Next actions

- Clear Launchpad cache; have user log out and back in.
- Rebuild content indexes if the system supports it.
- Re-validate apps visible after cache clear; if still missing, do role/catalog/authorization checks.
- Document for escalation: client, user, role, and whether cache clear helped.

## Escalation information

- Note whether cache clear and new session fixed the issue; include client and system alias.
