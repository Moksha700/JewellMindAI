# Security Specification: JewelMind AI

## 1. Data Invariants
- `profiles`: Keyed strictly by `request.auth.uid`. A user can only read and write their own profile document. Roles are strictly NEVER stored in the `profiles` table.
- `user_roles`: Keyed strictly by `request.auth.uid`. Managed with `hasRole(role)` security-definer pattern. A user can read their own role document to verify their status, but cannot self-promote to 'admin' or alter their own role. Only existing admins or bootstrapping can assign roles.
- `jewellery_records`: Owned by `request.auth.uid`. All operations (create, read, update, delete, list) require `resource.data.userId == request.auth.uid` or `incoming().userId == request.auth.uid`.

## 2. The Dirty Dozen Attack Payloads
1. **Unauthenticated Read on Profile**: Attempting to read `/profiles/target_user` without auth token. Expected: `PERMISSION_DENIED`.
2. **Foreign Profile Update**: User A attempting to update `/profiles/user_b`. Expected: `PERMISSION_DENIED`.
3. **Self-Promotion to Admin**: Standard user attempting to create or update `/user_roles/my_id` with `{ role: 'admin' }`. Expected: `PERMISSION_DENIED`.
4. **Role Injection into Profile**: Attempting to write `{ role: 'admin' }` into `/profiles/my_id`. Expected: `PERMISSION_DENIED`.
5. **Orphaned Record Creation**: Creating `/jewellery_records/rec1` where `userId != request.auth.uid`. Expected: `PERMISSION_DENIED`.
6. **Query Scraping (Blanket List)**: Executing a collection query on `/jewellery_records` without scoping to `where('userId', '==', auth.uid)`. Expected: `PERMISSION_DENIED`.
7. **Foreign Record Deletion**: User A attempting to delete `/jewellery_records/user_b_rec`. Expected: `PERMISSION_DENIED`.
8. **Payload Oversize Attack**: Submitting a title longer than 200 characters or notes longer than 2000 characters. Expected: `PERMISSION_DENIED`.
9. **Identity Spoofing on Record Update**: User updating an existing record and changing `userId` to another user. Expected: `PERMISSION_DENIED`.
10. **ID Poisoning Attack**: Submitting an invalid document ID with malicious path characters or > 128 characters. Expected: `PERMISSION_DENIED`.
11. **Non-Owner Read of Saved Records**: Attempting to get `/jewellery_records/target_user_item` without matching auth uid. Expected: `PERMISSION_DENIED`.
12. **Foreign Role Read**: User A attempting to read `/user_roles/user_b`. Expected: `PERMISSION_DENIED`.
