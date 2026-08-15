# Administration Functional-Requirement Traceability

Source: `Gropu23_SRS.pdf`, SRS v1.0, sections 3.1.20, US-08, US-10, and UC-03.

| Requirement | Current status | Implementation or remaining work |
|---|---|---|
| FR-ADMIN-01 | Implemented | Firebase authentication, local-user loading, active-account check, and administrator role guard protect all admin routes. |
| FR-ADMIN-02 | Implemented | Administrators can list, search, filter, suspend, and reactivate user accounts. Self-suspension is blocked. |
| FR-ADMIN-03 | Partial | Pending requests can be viewed, approved, or rejected. A complete view of all dealer accounts still needs to be added. |
| FR-ADMIN-04 | Implemented | Administrators can search, filter, view, and archive listings across dealerships. |
| FR-ADMIN-05 | Partial | Upload monitoring reads real upload-job records; dealer upload creation and ETL processing are still required. |
| FR-ADMIN-06 | Implemented | Persistent audit records are written for dealer reviews, user status changes, and listing removals. |
| FR-ADMIN-07 | Implemented | A protected endpoint reports current service health without mock values. |
| FR-ADMIN-08 | Partial | Backend and MongoDB report live state. Redis/BullMQ and the worker truthfully report `not_configured` until the upload pipeline is built. |
| FR-ADMIN-09 | Partial | The admin API reads recent uploads and failures from the real collection; activity will appear after upload creation and ETL are implemented. |
| FR-ADMIN-10 | Implemented | Dashboard reports total listings and registered active dealers using database counts. |

## Related requirements

- FR-USER-10 and FR-USER-11 are enforced by the shared admin route middleware.
- FR-DEALER-10 through FR-DEALER-13 are covered by the dealer review workflow, except the required audit entry for each decision.
- US-10 requires every approval and rejection to be recorded in the audit log; this remains part of FR-ADMIN-06.
- UC-03 cannot be complete until upload history, processing errors, and real health status are connected.

## Required build order

1. Add persistent audit logs and connect the audit-log screen.
2. Add complete dealer-account administration, not only pending requests.
3. Implement protected system-health checks.
4. Build upload jobs and ETL processing.
5. Connect recent uploads, failures, and upload monitoring to the admin dashboard.
