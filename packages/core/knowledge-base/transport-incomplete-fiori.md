# Incomplete Fiori Transport – Apps or Catalogs Missing After Transport

## If apps or catalogs are missing after activation or transport

Fiori apps or catalogs can be missing in the target system after transport. Launchpad tiles may not be visible. Often due to incomplete transport or wrong client.

## Symptoms

- Fiori apps or catalogs missing after transport.
- Launchpad tiles not visible in the target system.
- Catalog or role not in target client after STMS import.
- Apps not visible in Fiori on target system only.

## Likely causes

- Transport did not include all catalog/role content.
- Transport imported into the wrong client (client mismatch).
- Launchpad content not rebuilt after import.
- System alias or target mapping not transported or not active in target.

## Checks

- Verify in STMS that the transport was imported successfully.
- Confirm catalog, role, and target mappings exist in the target client.
- Check Launchpad content regeneration requirements.
- Confirm no client mismatch between where role was assigned and where user tests.

## Fix / Next actions

- Re-import missing content or add objects to transport.
- Rebuild Launchpad content where required.
- Validate role assignments in the target client.
- Re-run content activation if needed for Fiori Launchpad.

## Escalation information

- Provide transport ID, target system/client, and missing objects list.
- Include import logs from STMS and any activation errors.
