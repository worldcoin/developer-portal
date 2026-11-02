# Action metadata after the verification endpoint change

The public verification endpoint still creates actions after successful proof
verification, but it no longer stores a description supplied with the proof.
Applications can continue to use dynamic action identifiers. Configure persistent
descriptions through the authenticated Portal action settings (or an authorized
app-scoped management API), not through proof verification.

This prevents new untrusted descriptions. It does not establish the provenance
of descriptions already stored in `action_v4`.

## Review existing descriptions before closing remediation

1. Have an authorized operator inventory nonempty descriptions by RP, action,
   environment, and creation/update timestamps. Preserve a review snapshot.
2. Correlate retained creation logs and authenticated management activity with
   the app owner's intended description. Public automatic creation logs
   `Created new action_v4`; Portal creation logs `portal_action_creation`.
   Neither missing logs nor `created_at`/`updated_at` alone proves provenance.
   An automatically created action may subsequently have been edited legitimately.
3. Ask the app owner to confirm or replace descriptions whose current provenance
   is uncertain. Production descriptions can be corrected in the existing
   authenticated action settings. Have an authorized operator handle staging
   records, which those settings do not currently allow editing.
4. For confirmed unwanted descriptions, clear or replace only the description
   using an explicitly approved, scoped operation. Preserve action IDs and
   nullifier history. Do not delete and recreate actions, or bulk-clear every
   nonempty description.
5. Verify the corrected value through proof-context and the consuming
   authenticator. Track unresolved records separately from deployment of the
   prevention fix.

If retained audit evidence is insufficient for ongoing needs, add explicit
metadata provenance on authenticated writes in a separate change. Do not mark
legacy descriptions trusted solely because the action already exists.

No production cleanup or data migration is performed by this code change.
