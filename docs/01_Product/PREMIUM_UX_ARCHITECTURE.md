# WORKLY Premium UX Architecture

## Product rule
Each screen has one job. Information is summarized once and detailed only in the owning module.

## Company navigation
Primary dock: Home, Operations, Workers, Projects, Compliance, More.
Secondary (More): Teams, Attendance, Documents, Access, Company Profile.

## Worker navigation
Primary dock: Today, Attendance, Compliance, Documents, Profile, More.
Secondary (More): Certificates, Best Projects.

## Dashboard rule
The dashboard is not a second copy of modules. It shows only:
- current operational state
- priority alerts
- the next actions a user can take
- concise counts that link to the owning module

No worker lists, project lists, document lists or attendance logs are duplicated on Home.

## Visual rule
- dark unified background
- Worker blue accent / Company red accent
- one clear primary action per context
- restrained status colors (green/yellow/red only for state)
- consistent spacing/radii/type hierarchy
- responsive mobile/desktop behavior
- empty/loading/error states remain contextual

## Functional rule
- refresh current session on workspace entry so newly added permissions/modules appear without manual logout
- preserve backend authorization as authority
- navigation must never be the security boundary
- all secondary modules remain reachable from More
