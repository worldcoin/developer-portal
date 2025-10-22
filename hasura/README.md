# Hasura

This folder contains the Hasura code (API + DB) for World's Developer Portal.

## Notes

### ⚠️ Hasura Triggers Warning

**Hasura triggers are quite unstable and can cause serious issues:**

- Deleting an existing trigger might freeze Hasura and make it unresponsive
- Try to refrain from using triggers when possible
- When there is a need to delete a trigger, do it gracefully:
  1. First remove all traffic from the trigger
  2. Wait for existing operations to complete
  3. Then proceed with the deletion carefully
