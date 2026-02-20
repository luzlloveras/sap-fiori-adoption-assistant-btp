# Launchpad Content and Transport – Apps Not Visible After Transport

## If apps or content are missing after Fiori transport

If a catalog or role was transported, confirm it arrived in the target system and client. Launchpad tiles not visible or apps not visible in Fiori on target often mean content or transport issue; also check client mismatch and system alias.

## Symptoms

- Apps not visible in Fiori on target system after transport.
- Launchpad tiles missing; catalog or role not in target client.
- Content available in source but not in target after import.

## Checks

- Verify the transport request was imported successfully in the correct client.
- Confirm the catalog and role versions match in target.
- Rebuild the Launchpad content if required after transport.
- Check system alias and target mapping in target client.
- Ensure no client mismatch between import and user test.

## Fix / Next actions

- Re-import or complete transport if objects are missing.
- Rebuild Launchpad content after transport.
- Validate role and catalog in target client; clear cache and re-test.
- Fix system alias or client mismatch if applicable.

## Escalation information

- Transport ID, target system/client, list of missing objects, import log.
