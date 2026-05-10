# Organizations

Organizations let you group users and share access to the dashboard. You can create organizations, invite members, manage roles, and configure what each role is allowed to do.

## What Are Organizations?

An organization is a team or group. Members share the same context when using the dashboard. You might create one for your fire department, agency, or monitoring team.

## Create an Organization

1. Click the **Organization Switcher** in the top-right corner (shows your current org or "Personal")
2. Select **Create organization**
3. Enter the **organization name**
4. Optionally upload a photo
5. Click **Create**

You become the **admin** of the new organization.

## Switch Between Organizations

1. Click the **Organization Switcher** in the top-right corner
2. Select the organization you want to switch to
3. You can also switch to your **Personal** account

## Add Members

Only **admins** can invite members:

1. Click the **Organization Switcher**
2. Select **Manage organization**
3. Go to the **Members** tab
4. Click **Invite member**
5. Enter their **email address** and choose a **role** (Member or Admin)
6. Click **Send invitation**

The person receives an email with an invitation link.

## Manage Members

Open **Manage organization → Members** to:

- View all members and their roles
- Change a member's role
- Remove a member from the organization

## Manage Pending Invitations

Open **Manage organization → Members** (or Invitations tab) to see pending invitations. You can **revoke** an invitation before it's accepted.

## Roles

| Role | What they can do |
|------|-----------------|
| **Admin** | Full access: invite/remove members, change roles, manage permissions, and all member capabilities |
| **Member** | Capabilities controlled by the org's permission settings (see below) |

## Member Permissions

Admins can configure exactly what the Member role can do. To manage permissions:

1. Open **Manage organization**
2. Go to the **Permissions** tab (or equivalent settings section)
3. Toggle the permissions for **Member**:
   - **View nodes & telemetry** — can see sensor nodes, live data, the map, and historical readings
   - **Subscribe to nodes** — can subscribe and unsubscribe to sensor nodes
4. Click **Save**

If a member doesn't have **View nodes & telemetry**, they'll see an "Access Restricted" message on the dashboard instead of node data.

## Leave an Organization

1. Open **Manage organization → Members**
2. Find yourself and click **Leave organization**

You can't leave if you're the only admin — promote another member first, or delete the organization.
