# Quick Start Guide - New Features

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Backend API running (see backend README)
- Updated backend with new features deployed

### Installation

```bash
cd react-playground-front
npm install
```

### Environment Setup

Create `.env` file in the root directory:

```bash
# For local development
REACT_APP_API_URL=http://localhost:3000

# For production (Railway)
REACT_APP_API_URL=https://back-end-production-dad5.up.railway.app
```

### Run Development Server

```bash
npm start
```

App will open at `http://localhost:3000`

---

## 🔐 Testing Change Password Feature

### Step 1: Login

1. Navigate to `http://localhost:3000/login`
2. Use demo credentials:
   ```
   Username: john.doe
   Password: Password123!
   ```
3. Click "Sign In"

### Step 2: Access Change Password

1. After login, you'll see the todo list
2. Look at the header (top right)
3. Click the "Change Password" button (lock icon)

### Step 3: Change Password

1. Fill in the form:
   - **Current Password:** `Password123!`
   - **New Password:** `MyNewPass@789`
   - **Confirm New Password:** `MyNewPass@789`

2. Watch the requirements checklist:
   - ✓ At least 8 characters
   - ✓ One lowercase letter
   - ✓ One uppercase letter
   - ✓ One digit
   - ✓ One special character (@$!%*?&)

3. Click "Change Password"

4. You should see:
   - Success message: "Password changed successfully"
   - Auto-redirect to todo list after 2 seconds

### Step 4: Test New Password

1. Click "Logout"
2. Login again with new password:
   ```
   Username: john.doe
   Password: MyNewPass@789
   ```

### Testing Error Cases

**Wrong Current Password:**
```
Current Password: WrongPassword!
New Password: MyNewPass@789
Confirm: MyNewPass@789
```
Expected: "Current password is incorrect"

**Weak Password:**
```
Current Password: Password123!
New Password: weak
Confirm: weak
```
Expected: Submit button disabled, requirements show red ✗

**Password Mismatch:**
```
Current Password: Password123!
New Password: MyNewPass@789
Confirm: DifferentPass@456
```
Expected: "New password and confirmation do not match"

---

## 📅 Testing Task Due Dates Feature

### Step 1: Create Task with Due Date

1. Login to the app
2. Find or create a project
3. In the "Add Task" form:
   - **Task Name:** "Complete documentation"
   - **Due Date:** Select tomorrow's date
   - Click "Add Task"

4. Task should appear with:
   - Yellow left border (due soon)
   - Clock icon ⏰
   - Date displayed below task name

### Step 2: Create Task without Due Date

1. In the "Add Task" form:
   - **Task Name:** "Brainstorm ideas"
   - **Due Date:** Leave empty
   - Click "Add Task"

2. Task should appear without due date indicator

### Step 3: Edit Due Date

1. Find an existing task
2. Click on the date picker below the task
3. Select a new date
4. Date updates immediately
5. Visual indicators update based on new date

### Step 4: Test Visual Indicators

**Overdue Task:**
1. Create a task with yesterday's date
2. Should show:
   - Red left border
   - Warning icon ⚠️
   - Red date badge

**Due Soon Task:**
1. Create a task with date within 3 days
2. Should show:
   - Yellow left border
   - Clock icon ⏰
   - Yellow date badge

**Future Task:**
1. Create a task with date more than 3 days away
2. Should show:
   - Normal display
   - No special border
   - Date without icon

### Step 5: Remove Due Date

1. Find a task with a due date
2. Click on the date picker
3. Clear the date (browser-specific: usually backspace or clear button)
4. Due date should be removed

---

## 🎯 Quick Feature Overview

### Change Password
- **Route:** `/change-password`
- **Access:** Header → "Change Password" button
- **Requirements:** Strong password (8+ chars, uppercase, lowercase, digit, special char)
- **Validation:** Real-time with visual feedback

### Task Due Dates
- **Location:** Task list in each project
- **Add:** Date picker in "Add Task" form
- **Edit:** Date picker below each task
- **Visual Indicators:**
  - 🔴 Red border = Overdue
  - 🟡 Yellow border = Due soon (within 3 days)
  - ⚪ Normal = Future tasks

---

## 🐛 Troubleshooting

### Change Password Not Working

**Issue:** "You must be logged in to change password"
- **Solution:** Make sure you're logged in. Check if token exists in localStorage.

**Issue:** CORS error in console
- **Solution:** Ensure backend CORS is configured correctly. Check backend is running.

**Issue:** "Signature has expired"
- **Solution:** Token expired. Logout and login again.

### Due Dates Not Saving

**Issue:** Due date doesn't persist after refresh
- **Solution:** Check backend migration was run: `rails db:migrate`

**Issue:** Date picker not showing
- **Solution:** Browser may not support HTML5 date input. Try Chrome/Firefox/Safari.

**Issue:** GraphQL error about dueDate field
- **Solution:** Ensure backend is updated with latest code and migrations.

### General Issues

**Issue:** "Failed to fetch" error
- **Solution:** 
  1. Check backend is running
  2. Verify `REACT_APP_API_URL` in `.env`
  3. Check CORS configuration in backend

**Issue:** Blank page after login
- **Solution:**
  1. Check browser console for errors
  2. Verify GraphQL queries are updated
  3. Clear browser cache and localStorage

---

## 📝 Demo Credentials

```
Username: john.doe
Password: Password123!
```

**Note:** This password meets the new strong password requirements!

---

## 🔄 Resetting Demo Data

If you need to reset the demo data:

**Backend:**
```bash
cd react-playground
rails db:reset
```

This will:
- Drop and recreate database
- Run all migrations (including due_date)
- Seed demo user and tasks with due dates

**Frontend:**
```bash
# Clear browser localStorage
localStorage.clear()

# Or in browser console:
localStorage.removeItem('token')
```

---

## 📚 Next Steps

1. **Explore the features** - Try creating tasks with different due dates
2. **Test password change** - Change your password and login with new credentials
3. **Check documentation** - See `FEATURES.md` for detailed feature documentation
4. **Deploy to production** - See backend `RAILWAY_DEPLOYMENT.md` for deployment guide

---

## 🎨 Customization

### Change Password Styling

Edit `src/components/ChangePassword.css`:
- Change gradient colors
- Modify card styling
- Adjust button colors

### Task Due Date Colors

Edit `src/components/todoList/DragDrop.css`:
- `.task-box.overdue` - Change overdue color
- `.task-box.due-soon` - Change due soon color
- `.due-date-label` - Modify date badge styling

---

## ✅ Feature Checklist

After setup, verify these work:

**Change Password:**
- [ ] Can access change password page
- [ ] Password validation works in real-time
- [ ] Can successfully change password
- [ ] Can login with new password
- [ ] Error messages display correctly

**Task Due Dates:**
- [ ] Can create task with due date
- [ ] Can create task without due date
- [ ] Can edit existing task's due date
- [ ] Overdue tasks show red indicator
- [ ] Due soon tasks show yellow indicator
- [ ] Dates persist after page refresh

---

Happy coding! 🚀

