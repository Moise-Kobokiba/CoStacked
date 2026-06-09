# StackSuite Diagnostic Report

## PHASE 1 — ROOT CAUSE ANALYSIS

### CRITICAL BUG #1: `followMutation` undefined in List Views (RENDERING BREAKER)

**Files:** `ShowcasesTab.jsx` (line 442), `CollaborationTab.jsx` (line 539)

**Problem:** `followMutation` is only defined inside `ShowcaseDetailView` and `ThreadDetail` components, but is referenced directly in the list view rendering loops of `ShowcasesTab` and `CollaborationTab`. This causes a JavaScript runtime error (`followMutation is not defined`) that **prevents the entire tab from rendering**.

**Impact:** This is the PRIMARY reason existing Showcase and Collaboration posts are not appearing. The component crashes during rendering, so the empty state or loading state is never replaced with the actual data.

**Root Cause:** When the list views were refactored to use detail views, `followMutation` was moved inside the detail components but the list view rendering code still references it.

### CRITICAL BUG #2: Controller `createPost` missing destructured fields

**File:** `backend/controllers/stackSuiteController.js` (lines 100-170)

**Problem:** The `createPost` function destructures only `{ title, body, category, contentType, tags, phase, confidenceScore, links }` from `req.body`, but then tries to use undefined variables:
- `bipType`, `bipMilestone`, `bipRevenue`, `bipUsers`, `bipProgress`, `bipLookingFor` (build-in-public)
- `fmRole`, `fmSkills`, `fmAvailability`, `fmLocation` (founder-matching)
- `challengeType`, `challengeGoal`, `challengeDuration`, `challengeRewards` (challenge)
- `accGoal`, `accWeeklyTarget`, `accStatus` (accountability)
- `projectMeta` (showcase)

These fields are NEVER extracted from `req.body`, so they are always `undefined` when assigned to `postData`. Type-specific StackPost records are created with empty/null optional fields.

### CRITICAL BUG #3: Roles vs Team field mismatch

**File:** `StackSuitePage.jsx` line 314, `CollabThread.js`

**Problem:** The frontend sends `roles: collabRoles.split(',').map(r => r.trim()).filter(Boolean)` to the createCollabThread API, but the CollabThread model expects a `team` field (array of objects with initials, name, role), not `roles` (array of strings). The roles data is silently lost on creation.

### DUPLICATE FIELD IN MODEL: `contentType`

**File:** `backend/models/StackPost.js` (lines 27-31 AND lines 43-55)

**Problem:** The `contentType` field is defined TWICE:
- First definition (line 27-31): includes 'collaboration', excludes 'validation'
- Second definition (line 43-55): excludes 'collaboration', includes 'validation'

Mongoose uses the LAST definition, so `contentType: 'collaboration'` is invalid for StackPost. However, the collaboration flow uses the separate `CollabThread` model so this doesn't break collaboration. But the duplicate should be removed.

### QUERY/INVALIDATION ANALYSIS

**Showcases:**
- createShowcaseMutation invalidates: `['showcases']`
- ShowcasesTab query key: `['showcases', { search, sortBy, roleFilter }]`
- React Query v5: `invalidateQueries(['showcases'])` does prefix matching, so this works ✓

**Collaboration:**
- createCollabMutation invalidates: `['threads']`
- CollaborationTab query key: `['threads', { search, sortBy, roleFilter }]`
- Prefix matching works ✓

**Discussions:**
- createUnifiedPostMutation invalidates: `['stackPosts']`
- DiscussionsTab query key: `['stackPosts', { search, sortBy, roleFilter }]`
- Prefix matching works ✓

### STATS ISSUE

**File:** `StackSuitePage.jsx` line 454

**Problem:** Stats display `stats.totalPosts + stats.totalValidations` as "Active Posts". But `totalValidations` is hardcoded as `0` in the controller's `getStats` function (line 1164 of stackSuiteController.js). This should show total posts including validation posts.

## PHASE 2 — FEATURE INVENTORY

### VISIBLE FEATURES

| Feature | Status | Notes |
|---------|--------|-------|
| Discussions Tab | PARTIALLY WORKING | Shows posts but crashes due to followMutation |
| Showcases Tab | BROKEN | Crashes from followMutation in list view |
| Collaboration Tab | BROKEN | Crashes from followMutation in list view, roles data lost |
| Create Modal | WORKING | All 7 content type forms render correctly |
| Search | WORKING | Debounced search works |
| Sort | WORKING | Sort dropdown works |
| Tag Filter | WORKING | Tag cloud filter works |
| Stats Display | PARTIALLY WORKING | totalValidations hardcoded to 0 |
| Create Showcase | PARTIALLY WORKING | imageUrl, liveUrl, githubUrl not sent to backend |
| Create Collaboration | PARTIALLY WORKING | roles field not mapped to team |

### HIDDEN/BROKEN FEATURES

| Feature | File | Why Hidden |
|---------|------|------------|
| Build In Public detailed fields | stackSuiteController.js | Missing destructure in createPost |
| Founder Matching detailed fields | stackSuiteController.js | Missing destructure in createPost |
| Challenge detailed fields | stackSuiteController.js | Missing destructure in createPost |
| Accountability detailed fields | stackSuiteController.js | Missing destructure in createPost |
| Showcase create - imageUrl, liveUrl, githubUrl | stackSuiteController.js createShowcase | Controller doesn't destructure these from req.body |

## PHASE 3 — FIX PLAN

### Fix 1: Add `followMutation` to list views
Both `ShowcasesTab` and `CollaborationTab` list views need their own `followMutation` definitions.

### Fix 2: Add missing destructured fields to createPost controller
Add all type-specific fields to the destructuring in `createPost`.

### Fix 3: Map `roles` to `team` in collaboration creation
Update StackSuitePage.jsx to send `team` field instead of or in addition to `roles`, or update CollabThread model to accept a `roles` field.

### Fix 4: Add missing fields to createShowcase controller
Add `imageUrl`, `liveUrl`, `githubUrl` to the destructuring in `createShowcase` controller.

### Fix 5: Remove duplicate `contentType` from StackPost model
Remove the first `contentType` definition and keep the comprehensive one.

### Fix 6: Update totalValidations in getStats
Calculate actual validation post count instead of hardcoding 0.