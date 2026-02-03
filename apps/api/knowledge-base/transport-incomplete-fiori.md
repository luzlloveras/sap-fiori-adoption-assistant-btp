# Incomplete Transport of Fiori Content

## Symptoms
- Fiori apps or catalogs missing after transport.
- Launchpad tiles not visible in the target system.

## Likely causes
- Transport did not include all catalog/role content.
- Transport imported into the wrong client.
- Launchpad content not rebuilt after import.

## Checks
- Verify in STMS that the transport was imported successfully.
- Confirm catalog, role, and target mappings exist in the target client.
- Check Launchpad content regeneration requirements.

## Fix / next actions
- Re-import missing content or add objects to transport.
- Rebuild Launchpad content where required.
- Validate role assignments in the target client.

## Escalation info
- Provide transport ID, target system/client, and missing objects list.
- Include import logs from STMS.
