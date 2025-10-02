# Frontend Features Documentation

## 🔐 Feature 1: Change Password

### Overview
Users can now change their password with real-time validation and visual feedback for password strength requirements.

### User Interface

**Location:** `/change-password` route

**Access:** Click "Change Password" button in the header (next to Logout)

### Features

1. **Real-time Password Validation**
   - Visual indicators for each requirement
   - Green checkmarks (✓) for met requirements
   - Red crosses (✗) for unmet requirements

2. **Password Requirements**
   - ✅ Minimum 8 characters
   - ✅ At least one lowercase letter (a-z)
   - ✅ At least one uppercase letter (A-Z)
   - ✅ At least one digit (0-9)
   - ✅ At least one special character (@$!%*?&)

3. **Form Validation**
   - Current password verification
   - New password confirmation matching
   - Client-side validation before API call
   - Server-side validation with error messages

4. **User Experience**
   - Submit button disabled until password meets all requirements
   - Loading state during password change
   - Success message with auto-redirect to todo list
   - Clear error messages for failed attempts
   - Cancel button to return to todo list

### Screenshots Flow

1. User clicks "Change Password" in header
2. Form displays with three fields:
   - Current Password
   - New Password
   - Confirm New Password
3. As user types new password, requirements checklist updates in real-time
4. Submit button enables only when all requirements are met
5. On success: Shows success message and redirects after 2 seconds
6. On error: Shows specific error message (wrong password, weak password, etc.)

### Error Handling

- **Wrong Current Password:** "Current password is incorrect"
- **Password Mismatch:** "New password and confirmation do not match"
- **Weak Password:** "Password does not meet strength requirements"
- **Not Authenticated:** Redirects to login page

---

## 📅 Feature 2: Task Due Dates

### Overview
Tasks can now have optional due dates with visual indicators for overdue and upcoming deadlines.

### User Interface

**Location:** Task list in each project

### Features

1. **Add Due Date When Creating Task**
   - Date picker in the "Add Task" form
   - Optional field (can create tasks without due dates)
   - Uses native HTML5 date input

2. **Edit Due Date on Existing Tasks**
   - Date picker appears below each task
   - Click to change or set due date
   - Updates immediately on change
   - Can clear due date by selecting empty value

3. **Visual Indicators**

   **Overdue Tasks:**
   - Red left border
   - Red badge with warning icon (⚠️)
   - Red text for due date
   - Example: "⚠️ Sep 29"

   **Due Soon (within 3 days):**
   - Yellow/amber left border
   - Yellow badge with clock icon (⏰)
   - Amber text for due date
   - Example: "⏰ Oct 4"

   **Future Tasks:**
   - No special border
   - Normal date display
   - Example: "Oct 15"

4. **Date Display**
   - Compact format: "Month Day" (e.g., "Oct 15")
   - Shows below task name
   - Only displays if due date is set

### Task Form Updates

**Before:**
```
[Task Name Input] [Add Task Button]
```

**After:**
```
[Task Name Input] [Due Date Picker] [Add Task Button]
```

### Task Display Updates

**Before:**
```
☐ Task name
```

**After:**
```
☐ Task name
  [Date Picker] Oct 15
```

**With Overdue:**
```
| ☐ Task name
|   [Date Picker] ⚠️ Sep 29
```
(Red left border)

### GraphQL Integration

**Updated Queries:**
- `GET_PROJECTS` - Now includes `dueDate` field
- `CREATE_TASK` - Accepts optional `dueDate` parameter
- `UPDATE_TASK` - Accepts optional `dueDate` parameter

**Date Format:**
- ISO8601 Date format: `YYYY-MM-DD`
- Example: `"2025-10-15"`

---

## 🎨 Styling

### Change Password Page
- Gradient background (purple theme)
- Glassmorphism card design
- Smooth transitions and hover effects
- Responsive design for mobile devices
- Color-coded validation feedback

### Task Due Dates
- Inline date pickers with subtle styling
- Color-coded borders for task urgency:
  - Red (#dc3545) for overdue
  - Yellow (#ffc107) for due soon
- Emoji indicators for quick visual scanning
- Hover effects on date inputs

---

## 🚀 Usage Examples

### Change Password

1. **Navigate to Change Password:**
   ```
   Click "Change Password" button in header
   ```

2. **Fill in the form:**
   - Current Password: `Password123!`
   - New Password: `NewSecure@456`
   - Confirm: `NewSecure@456`

3. **Watch validation:**
   - Requirements checklist updates as you type
   - Submit button enables when all requirements met

4. **Submit:**
   - Success: "Password changed successfully" → Redirects to todo list
   - Error: Shows specific error message

### Task Due Dates

1. **Create Task with Due Date:**
   ```
   Task Name: "Complete project documentation"
   Due Date: [Select Oct 15, 2025]
   Click "Add Task"
   ```

2. **Edit Due Date:**
   ```
   Click on date picker below task
   Select new date
   Updates automatically
   ```

3. **Visual Feedback:**
   - Task due tomorrow → Yellow border + ⏰ icon
   - Task overdue → Red border + ⚠️ icon
   - Task due next week → Normal display

---

## 📱 Responsive Design

### Desktop
- Full-width forms with side-by-side buttons
- Inline date pickers
- Hover effects on all interactive elements

### Mobile
- Stacked form layout
- Full-width buttons
- Touch-friendly date pickers
- Optimized spacing for smaller screens

---

## 🔧 Technical Details

### Components Created/Modified

**New Components:**
- `ChangePassword.tsx` - Password change form with validation
- `ChangePassword.css` - Styling for password change page

**Modified Components:**
- `Task.tsx` - Added due date display and editing
- `TaskForm.tsx` - Added due date input field
- `TodoList.tsx` - Added "Change Password" link
- `App.jsx` - Added `/change-password` route

**Updated Files:**
- `queries/auth.js` - Added `CHANGE_PASSWORD` mutation
- `queries/projects.js` - Updated queries to include `dueDate`
- `DragDrop.css` - Added task due date styles
- `todoList.css` - Added change password link styles

### State Management
- Uses React hooks (`useState`) for form state
- GraphQL mutations for API calls
- LocalStorage for JWT token
- Redux for global auth state

### Validation
- Client-side validation before API call
- Real-time password strength checking
- Server-side validation with detailed error messages
- Date validation through HTML5 date input

---

## ✅ Testing Checklist

### Change Password
- [ ] Can navigate to change password page
- [ ] Password requirements display correctly
- [ ] Requirements update in real-time as user types
- [ ] Submit button disabled when requirements not met
- [ ] Submit button enabled when all requirements met
- [ ] Shows error for wrong current password
- [ ] Shows error for password mismatch
- [ ] Shows error for weak password
- [ ] Shows success message on successful change
- [ ] Redirects to todo list after success
- [ ] Cancel button returns to todo list
- [ ] Redirects to login if not authenticated

### Task Due Dates
- [ ] Can create task with due date
- [ ] Can create task without due date
- [ ] Can edit due date on existing task
- [ ] Can remove due date from task
- [ ] Overdue tasks show red border and ⚠️ icon
- [ ] Due soon tasks show yellow border and ⏰ icon
- [ ] Future tasks display normally
- [ ] Date format displays correctly
- [ ] Date picker works on mobile
- [ ] Due dates persist after page refresh

---

## 🐛 Known Issues / Future Enhancements

### Potential Enhancements
1. **Password Strength Meter:** Visual bar showing password strength
2. **Password Visibility Toggle:** Eye icon to show/hide password
3. **Task Filtering:** Filter tasks by due date (overdue, today, this week)
4. **Task Sorting:** Sort tasks by due date
5. **Due Date Notifications:** Browser notifications for upcoming deadlines
6. **Recurring Tasks:** Support for recurring due dates
7. **Calendar View:** Calendar view of all tasks with due dates

### Browser Compatibility
- Tested on Chrome, Firefox, Safari, Edge
- HTML5 date input may have different styling across browsers
- Fallback to text input on older browsers

---

## 📚 Related Documentation

- Backend API: See `/NEW_FEATURES.md` in backend repo
- GraphQL Examples: See `/GRAPHQL_EXAMPLES.md` in backend repo
- Deployment: See `/RAILWAY_DEPLOYMENT.md` in backend repo

