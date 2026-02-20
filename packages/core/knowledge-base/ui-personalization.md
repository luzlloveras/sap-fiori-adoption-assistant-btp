# UI Personalization and Apps Not Visible in Fiori Launchpad

## If apps are missing for one user but others see them

Users can hide tiles or remove them from pages. Personalization can make apps appear missing in Fiori Launchpad even when the role and catalog are correct.

## Symptoms

- Apps not visible in Launchpad for one user; other users see the same apps.
- Tiles missing from a space or page after personalization changes.
- Launchpad layout differs per user with same business role.

## Checks

- Reset personalization for the user.
- Test with a fresh user to compare results.
- Confirm the space/page is not filtered by personalization.
- Verify business role and catalog are correct before blaming personalization.

## Fix / Next actions

- Clear or reset UI personalization for the affected user.
- Re-test with a new session after reset.
- If apps still not visible, proceed to role/catalog/authorization checks.

## Escalation information

- Note whether the issue is one user or multiple; include client and system alias.
