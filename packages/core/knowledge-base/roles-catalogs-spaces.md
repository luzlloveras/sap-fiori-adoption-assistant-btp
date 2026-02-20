# Roles, Catalogs, Spaces, and Pages – Apps Not Visible in Fiori Launchpad

## How they relate

Business roles bundle catalogs, spaces, and pages. Catalogs define target mappings and tiles. Spaces and pages control what appears in the Fiori Launchpad layout. Wrong role, catalog, or space/page causes apps not visible in Launchpad.

## When apps are not visible in Launchpad

If a user can log in but sees no apps in Fiori Launchpad, confirm the business role includes at least one catalog with visible tiles and that the assigned space/page is active. Check for client mismatch and system alias.

## Symptoms

- User logs in to Fiori Launchpad but sees no tiles or wrong set of apps.
- Apps not visible in Launchpad although role is assigned.
- Only some catalogs or spaces visible.

## Checks

- Verify the business role contains the required catalog.
- Ensure the space and page are assigned to the same role.
- Confirm the catalog has target mappings for the intended apps.
- Check PFCG role behind the business role and client/system alias.

## Fix / Next actions

- Assign or correct business role and catalog.
- Activate space and page for the role.
- Ensure target mappings exist for the apps.
- Clear Launchpad cache and re-test.

## Escalation information

- Provide business role name, catalog, space/page, client, and system alias.
