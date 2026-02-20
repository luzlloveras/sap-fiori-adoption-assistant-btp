# Fiori Launchpad Theme Issues – Blank Page, Shell Bar, CSS

## If Launchpad loads but UI is broken or blank after theme change

Launchpad may load but show a blank page, missing shell bar, or wrong styles. Often related to theme (Quartz, Belize, SAP Fiori 3) or cached CSS. Can overlap with HTTP 403/401 if theme resources are blocked.

## Symptoms

- Fiori Launchpad loads but UI looks broken or missing shell bar.
- Styles appear incorrect after theme change.
- Blank or white area in Launchpad; theme resources 401/403 in network.
- Launchpad blank page that is not clearly UI2 or authorization.

## Likely causes

- Theme configuration mismatch (Quartz/Belize/SAP Fiori 3).
- Cached CSS or personalization causing layout issues.
- Missing or unauthorized UI theme resources (can show as 403).
- Client or system alias wrong for theme resolution.

## Checks

- Confirm the assigned theme for the user and system.
- Test with a standard theme to isolate CSS.
- Clear browser cache and user personalization.
- Check network for 401/403 on theme or UI5 resources.
- Verify SICF services for theming if Launchpad blank page.

## Fix / Next actions

- Revert to a default theme and retest.
- Reapply theme configuration after cache clear.
- Validate UI theme resources are accessible and authorized.
- If still blank page, follow UI2 and authorization checks.

## Escalation information

- Provide theme name, browser version, and screenshots.
- Include console or network errors for UI resources (e.g. HTTP 403 on theme URLs).
