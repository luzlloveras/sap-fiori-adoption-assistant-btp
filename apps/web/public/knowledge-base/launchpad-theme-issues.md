# Launchpad Theme Issues

## Symptoms
- Launchpad loads but UI looks broken or missing shell bar.
- Styles appear incorrect after theme change.

## Likely causes
- Theme configuration mismatch (Quartz/Belize/SAP Fiori 3).
- Cached CSS or personalization causing layout issues.
- Missing UI theme resources.

## Checks
- Confirm the assigned theme for the user and system.
- Test with a standard theme to isolate CSS.
- Clear browser cache and user personalization.

## Fix / next actions
- Revert to a default theme and retest.
- Reapply theme configuration after cache clear.
- Validate UI theme resources are accessible.

## Escalation info
- Provide theme name, browser version, and screenshots of the issue.
- Include any console or network errors for UI resources.
