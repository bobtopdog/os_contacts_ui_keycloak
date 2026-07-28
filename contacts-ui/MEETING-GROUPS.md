# Meeting Groups — Integration Guide

## Requirements coverage

1. ✅ Create + rename groups — `MeetingGroupsPanel.tsx` (offcanvas, same pattern as Communities)
2. ✅ Add/remove members — inside the panel, admin-only controls
3. ✅ Roles — 'admin' (manage userbase) and 'viewer'. Only the CREATOR can grant/revoke
   admin (role toggle button next to each member, creator only). Enforced at DB level.
4. ✅ Email alert to all admins on any group change (rename, member added/removed,
   role changed) — fire-and-forget so API responses are never blocked
5. ✅ Meeting tagging — `MeetingGroupTagger.tsx` drops into each meeting card;
   dropdown shows only groups the user belongs to; ALL group members emailed on tag
6. ✅ CSV download — button in the panel calls `GET /api/meeting-groups/:groupId/csv`
   (username, role, added date columns; Content-Disposition attachment)

## New dependency

    npm install nodemailer
    npm install -D @types/nodemailer

## New environment variables

    # SMTP relay
    SMTP_HOST=smtp.company.com
    SMTP_PORT=25
    SMTP_SECURE=false
    SMTP_FROM="Contacts App <noreply@company.com>"
    # Only if the relay requires auth:
    # SMTP_USER=...
    # SMTP_PASSWORD=...

    # Email derivation: username@EMAIL_DOMAIN
    EMAIL_DOMAIN=company.com

If SMTP_HOST is unset (local dev), emails are logged to the console instead
of sent, so you can develop without a relay.

## Migration

Add to package.json scripts and run:

    "db:migrate:meeting-groups": "node scripts/migrate-meeting-groups.js"
    npm run db:migrate:meeting-groups

## Wiring the offcanvas (same as Communities)

In your layout offcanvas area:

    import MeetingGroupsPanel from '@/components/MeetingGroupsPanel';

    <div className="offcanvas offcanvas-end" tabIndex={-1} id="meetingGroupsOffcanvas"
         style={{ width: '480px' }}>
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title fw-bold">👥 Meeting Groups</h5>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
      </div>
      <div className="offcanvas-body">
        <MeetingGroupsPanel />
      </div>
    </div>

Trigger button (Navbar or wherever):

    <button className="btn btn-outline-light btn-sm"
            data-bs-toggle="offcanvas" data-bs-target="#meetingGroupsOffcanvas">
      👥 Groups
    </button>

## Wiring the tagger into meeting cards

In `ContactMeetings.tsx`, inside the MeetingCard view mode (e.g. under the
document links section), add:

    import MeetingGroupTagger from '@/components/MeetingGroupTagger';

    <MeetingGroupTagger meetingId={meeting.meetingId} />

It shows existing group tags as badges (with remove ✕ for the tagger) and a
dropdown+Tag button listing only the groups the current user belongs to.
Users in no groups see only existing tags; if there are none, the component
renders nothing.

## Permission model summary

| Action                    | Who |
|---------------------------|-----|
| Create group              | any authenticated user (becomes creator + admin) |
| Rename group              | admins (incl. creator) |
| Delete group              | creator only |
| Add / remove members      | admins |
| Grant / revoke admin role | creator only |
| Remove the creator        | nobody |
| Tag a meeting             | any group member |
| Remove a tag              | the user who tagged |
| Download CSV              | any group member |

All checks are enforced in SQL (`WHERE ... role='admin'` / `created_by = $x`)
as well as hidden in the UI.
