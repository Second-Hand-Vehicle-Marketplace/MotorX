# Administration Functional-Requirement Traceability

Source: `Gropu23_SRS.pdf`, SRS v1.0, sections 3.1.20, US-08, US-10, and UC-03.

| Requirement | Current status | Implementation or remaining work |
|---|---|---|
| FR-ADMIN-01 | Implemented | Firebase authentication, local-user loading, active-account check, and administrator role guard protect all admin routes. |
| FR-ADMIN-02 | Implemented | Administrators can list, search, filter, suspend, and reactivate user accounts. Self-suspension is blocked. |
| FR-ADMIN-03 | Partial | Pending requests can be viewed, approved, or rejected. The standard dashboard now links review work and active-dealer counts; a complete filtered dealer-account view still needs to be added. |
| FR-ADMIN-04 | Implemented | Administrators can search, filter, view, and archive listings across dealerships. |
| FR-ADMIN-05 | Implemented | Upload monitoring and the business-facing dashboard read real upload-job records, statuses, accepted/rejected counts, and actionable links. |
| FR-ADMIN-06 | Implemented | Persistent audit records are written for dealer reviews, user status changes, and listing removals. |
| FR-ADMIN-07 | Implemented | Backend liveness and dependency-aware readiness are exposed for technical operators; technical diagnostics are not standard business-dashboard navigation. |
| FR-ADMIN-08 | Partial | Database readiness is live and worker/queue diagnostics remain protected operational work. Business administrators receive workflow impact and next-action language instead of infrastructure status. |
| FR-ADMIN-09 | Implemented | The admin API and dashboard read recent uploads, failures, accepted/rejected counts, and administrative activity from real collections. |
| FR-ADMIN-10 | Implemented | Dashboard reports registered users, active dealers, active listings, total listings, and pending applications using platform-wide database counts. |

## Related requirements

- FR-USER-10 and FR-USER-11 are enforced by the shared admin route middleware.
- FR-DEALER-10 through FR-DEALER-13 are covered by the dealer review workflow, except the required audit entry for each decision.
- US-10 requires every approval and rejection to be recorded in the audit log; this remains part of FR-ADMIN-06.
- UC-03 cannot be complete until upload history, processing errors, and real health status are connected.

## Remaining work

1. Add complete dealer-account administration, not only pending requests.
2. Add notification outbox recovery and broaden transactional audit coverage.
3. Add browser journey coverage for review, upload recovery, and business dashboard actions.
