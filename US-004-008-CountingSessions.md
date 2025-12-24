# US-004 to US-008: Counting Session Management Implementation Checklist

## User Stories Covered
- **US-004:** Start Counting Session
- **US-005:** View Active Counting Sessions
- **US-006:** Pause Counting Session
- **US-007:** Resume Counting Session
- **US-008:** View Counting History

---

## Backend Setup

### 1. Database Schema
- [ ] Create migration: counting_sessions table
  - id (UUID primary key)
  - user_id (foreign key to users)
  - session_name (optional)
  - status (enum: 'active', 'paused', 'completed')
  - warehouse_location (string)
  - started_at (timestamp)
  - paused_at (timestamp, nullable)
  - resumed_at (timestamp, nullable)
  - completed_at (timestamp, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
- [ ] Create migration: counted_items table
  - id (UUID primary key)
  - session_id (foreign key to counting_sessions)
  - item_code (string)
  - barcode (string)
  - item_description (string, cached from SAP)
  - unit_of_measure (string)
  - quantity_counted (integer)
  - sap_stock_level (integer, cached at scan time)
  - scanned_at (timestamp)
  - created_at (timestamp)
  - updated_at (timestamp)
- [ ] Run migrations
- [ ] Create seed data for test sessions

### 2. Models & Services
- [ ] Create CountingSession model with Knex queries
  - findById()
  - findByUserId()
  - findActiveByUserId()
  - create()
  - update()
  - updateStatus()
  - delete()
- [ ] Create CountedItem model with Knex queries
  - findById()
  - findBySessionId()
  - create()
  - update()
  - delete()
- [ ] Create SessionService with business logic
  - startSession(userId, warehouseLocation)
  - getActiveSession(userId)
  - pauseSession(sessionId, userId)
  - resumeSession(sessionId, userId)
  - completeSession(sessionId, userId)
  - getSessionHistory(userId, filters)
  - getSessionSummary(sessionId)

### 3. API Endpoints
- [ ] POST /api/sessions - Start new counting session
  - Input: warehouseLocation, sessionName (optional)
  - Returns: session object
- [ ] GET /api/sessions/active - Get user's active session
  - Returns: active session with summary (item count, total quantity)
- [ ] GET /api/sessions/:id - Get specific session details
  - Returns: session with all counted items
- [ ] GET /api/sessions - Get session history
  - Query params: status, startDate, endDate, page, limit
  - Returns: paginated list of sessions
- [ ] PATCH /api/sessions/:id/pause - Pause session
  - Returns: updated session
- [ ] PATCH /api/sessions/:id/resume - Resume session
  - Returns: updated session
- [ ] PATCH /api/sessions/:id/complete - Complete session
  - Returns: updated session
- [ ] DELETE /api/sessions/:id - Delete session
  - Only if status is not 'completed'
- [ ] Add authentication middleware to all session endpoints
- [ ] Add request validation (Zod schemas)

### 4. Business Rules
- [ ] User can only have ONE active session at a time
- [ ] Cannot start new session if active session exists
- [ ] Can only pause/resume active sessions
- [ ] Can only complete active or paused sessions
- [ ] Cannot delete completed sessions
- [ ] Session actions only allowed by session owner

### 5. Testing
- [ ] Test session creation
- [ ] Test preventing multiple active sessions
- [ ] Test pause/resume flow
- [ ] Test session completion
- [ ] Test session history retrieval
- [ ] Test unauthorized access to other user's sessions
- [ ] Create test script (test-sessions.sh)

---

## Frontend Implementation

### 6. State Management
- [ ] Create SessionContext (context/SessionContext.tsx)
- [ ] Implement session state management
  - activeSession
  - sessionHistory
  - isLoading
- [ ] Create session actions
  - startSession()
  - pauseSession()
  - resumeSession()
  - completeSession()
  - fetchActiveSession()
  - fetchSessionHistory()

### 7. API Client
- [ ] Create session service (services/session.service.ts)
  - startSession(warehouseLocation, sessionName?)
  - getActiveSession()
  - getSession(sessionId)
  - getSessions(filters)
  - pauseSession(sessionId)
  - resumeSession(sessionId)
  - completeSession(sessionId)
  - deleteSession(sessionId)

### 8. Home/Dashboard Screen Updates
- [ ] Update app/(tabs)/index.tsx as main dashboard
- [ ] Add "Start New Session" button
- [ ] Display active session card if exists
  - Session name or date
  - Status badge (Active/Paused)
  - Items scanned count
  - Total quantity counted
  - Action buttons (Pause/Resume, Complete)
- [ ] Add quick stats overview
  - Sessions today
  - Items counted today
  - Last session timestamp

### 9. Session Management Screens
- [ ] Create app/(tabs)/sessions.tsx - Session history screen
  - List all sessions (active, paused, completed)
  - Filter by status
  - Show session summary for each
  - Tap to view details
- [ ] Create app/session/[id].tsx - Session detail screen
  - Show full session info
  - List all counted items
  - Show summary statistics
  - Resume/Complete/Delete actions
- [ ] Create components/SessionCard.tsx
  - Reusable session display card
  - Status badge
  - Summary info
  - Action buttons

### 10. Session Creation Flow
- [ ] Create modal/sheet for starting new session
  - Warehouse location selector
  - Optional session name
  - Start button
- [ ] Validate warehouse location
- [ ] Handle "already have active session" error
- [ ] Navigate to scanner after session created

### 11. Session Control UI
- [ ] Add floating action button or header controls
  - Pause button (when active)
  - Resume button (when paused)
  - Complete button
- [ ] Add confirmation dialogs
  - Confirm pause
  - Confirm complete
  - Confirm delete
- [ ] Show session timer (time since started)

### 12. Error Handling
- [ ] Handle network errors gracefully
- [ ] Show offline indicator for session operations
- [ ] Cache active session locally
- [ ] Sync session status on reconnect
- [ ] Handle session conflicts (active on another device)

### 13. Navigation Updates
- [ ] Add Sessions tab to bottom navigation
- [ ] Update navigation flow for session lifecycle
- [ ] Handle deep linking to specific sessions

### 14. Testing
- [ ] Test starting new session
- [ ] Test viewing active session
- [ ] Test pause/resume flow
- [ ] Test completing session
- [ ] Test viewing session history
- [ ] Test session persistence after app restart
- [ ] Test error handling (no internet, etc.)

---

## UI/UX Considerations

### 15. Design
- [ ] Design session status badges (colors, icons)
- [ ] Design session cards layout
- [ ] Design empty states
  - No active session
  - No session history
- [ ] Design loading states
- [ ] Design confirmation dialogs

### 16. Accessibility
- [ ] Add proper labels for screen readers
- [ ] Ensure sufficient color contrast
- [ ] Add touch target sizes (min 44x44)
- [ ] Test with VoiceOver/TalkBack

---

## Performance Optimization

### 17. Optimization
- [ ] Implement pagination for session history
- [ ] Cache active session in memory
- [ ] Debounce session status updates
- [ ] Optimize session list rendering
- [ ] Add pull-to-refresh for session list

---

## Future Enhancements (Out of Scope for Now)
- [ ] Session templates
- [ ] Collaborative sessions (multiple users)
- [ ] Session notes/comments
- [ ] Export session data (CSV, PDF)
- [ ] Session analytics dashboard
