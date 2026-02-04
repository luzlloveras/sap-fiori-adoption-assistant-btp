# Authorization Checks Approach

## When to run checks
If the user sees the launchpad but not specific apps, authorization checks can reveal missing objects or values.

## Practical approach
- Identify the missing app's target mapping.
- Run an authorization trace or check for the user.
- Compare required objects to the roles assigned.

## What to capture
Capture the failed authorization object, field, and value.
