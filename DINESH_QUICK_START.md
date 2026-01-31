# 🚀 Dinesh Voice Assistant - Quick Start Guide

## Prerequisites Checklist

✅ Next.js project running  
✅ Supabase configured  
✅ Database connection established  

## Setup Steps

### 1. Database Setup (IMPORTANT - Do this first!)

```bash
# Option 1: Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Open sql/dinesh_voice_assistant.sql
4. Copy the entire contents
5. Paste in SQL Editor
6. Click "Run"

# Option 2: Using Supabase CLI (if installed)
supabase db push sql/dinesh_voice_assistant.sql
```

### 2. Verify Tables Created

Run this query in Supabase SQL Editor to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'support_requests', 
  'customer_feedback_dinesh', 
  'dinesh_interactions',
  'support_request_attachments'
);
```

You should see all 4 tables listed.

### 3. Test the Application

```bash
# Development mode
npm run dev

# Then visit: http://localhost:3000
```

### 4. First Test - Customer Side

1. **Open homepage** - http://localhost:3000
2. **Look for Dinesh** - Purple circular button on bottom-left
3. **Click the button** - Chat window opens
4. **Try voice**: Click the microphone icon and say:
   - "What can you do?"
   - "Take me to booking"
   - "Show me your services"
5. **Try text**: Type "I need help" and press Send

### 5. First Test - Admin Side

1. **Login as admin** - http://localhost:3000/admin/login
2. **Navigate to Dinesh Support**:
   - Click "Dinesh Support" in sidebar (with purple "Voice" badge)
   - OR go directly to: http://localhost:3000/admin/dinesh-support
3. **Try creating test data**:
   - Go back to homepage
   - Say "I need support" to Dinesh
   - Or use the support form
4. **Check admin dashboard** to see the request

## Browser Compatibility

### ✅ Best Experience
- **Chrome** (Recommended)
- **Microsoft Edge**

### ⚠️ Limited Support
- **Safari** - Voice works on iOS 14.5+, older versions use text only
- **Firefox** - Voice recognition limited, but text works perfectly

### 📱 Mobile
- Works on all mobile browsers
- Voice works on mobile Chrome and Safari (iOS 14.5+)

## Common Issues & Solutions

### Issue: "Dinesh button not showing"

**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors

### Issue: "Voice not working"

**Checklist:**
- [ ] Using Chrome or Edge browser
- [ ] Microphone permission granted
- [ ] Running on HTTPS or localhost
- [ ] Not muted in Dinesh interface

**How to fix:**
1. Click the lock icon in address bar
2. Check microphone permissions
3. Reload page
4. Try clicking microphone again

### Issue: "Database connection error"

**Solution:**
1. Check `.env.local` has correct Supabase credentials
2. Verify database migration ran successfully
3. Check Supabase dashboard → Database → Tables

### Issue: "Admin page not loading"

**Solution:**
1. Ensure you're logged in as admin
2. Check profile has `role = 'admin'` in database
3. Clear cookies and login again

## Feature Testing Checklist

### Voice Assistant Features
- [ ] Dinesh button appears on homepage
- [ ] Chat window opens when clicked  
- [ ] Voice recognition works (Chrome/Edge)
- [ ] Text input works as fallback
- [ ] Dinesh speaks responses (unmuted)
- [ ] Navigation commands work
- [ ] Service queries get responses

### Support Request Flow
- [ ] Can create support request via voice
- [ ] Can create support request via form
- [ ] Request appears in admin dashboard
- [ ] Admin can respond to request
- [ ] Status updates work
- [ ] Conversation history tracked

### Feedback Flow
- [ ] Can submit feedback via form
- [ ] Feedback appears in admin dashboard
- [ ] Admin can review feedback
- [ ] Status updates work
- [ ] Rating and satisfaction captured

### Admin Dashboard
- [ ] Statistics show correct counts
- [ ] Filter by status works
- [ ] Search functionality works
- [ ] Can respond to support requests
- [ ] Can review feedback
- [ ] Tab switching works

## Quick Voice Command Examples

Try these commands with Dinesh:

### Navigation
```
"Take me home"
"Open booking page"  
"Show services"
"Go to contact"
"Open my profile"
"Show my bookings"
```

### Information
```
"What services do you offer?"
"What are your hours?"
"How much does it cost?"
"Tell me about ceramic coating"
"Where are you located?"
```

### Support
```
"I need help"
"I have a problem"
"I want to give feedback"
"I have a suggestion"
```

## Admin Quick Actions

### View Support Requests
1. Go to `/admin/dinesh-support`
2. Click "Support Requests" tab (default)
3. Click any request to view details

### Respond to Support
1. Select a request
2. Type response in text area
3. Click "Send Response & Mark Resolved"

### Review Feedback
1. Click "Customer Feedback" tab
2. Click any feedback item
3. Add admin notes
4. Click status button (Reviewed/Acknowledged/Implemented)

## Production Deployment

### Before deploying:

1. **Run database migration on production**
   ```bash
   # In production Supabase dashboard
   # Run sql/dinesh_voice_assistant.sql
   ```

2. **Verify environment variables**
   ```bash
   # Check .env.production or hosting platform
   NEXT_PUBLIC_SUPABASE_URL=your_production_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
   ```

3. **Test voice features**
   - Voice API requires HTTPS
   - Test on production URL after deploy

4. **Build and deploy**
   ```bash
   npm run build
   # Deploy using your platform (Vercel, etc.)
   ```

## Monitoring

### Check Interaction Logs

```sql
-- Recent interactions
SELECT * FROM dinesh_interactions 
ORDER BY created_at DESC 
LIMIT 50;

-- Popular queries
SELECT interaction_type, COUNT(*) as count
FROM dinesh_interactions
GROUP BY interaction_type
ORDER BY count DESC;

-- User satisfaction
SELECT 
  AVG(satisfaction_score) as avg_satisfaction,
  COUNT(*) as total_feedback
FROM customer_feedback_dinesh;
```

### Check Support Metrics

```sql
-- Support request analytics
SELECT get_support_analytics('2024-01-01'::timestamptz);

-- Pending requests
SELECT COUNT(*) as pending_count
FROM support_requests
WHERE status = 'pending';
```

## Next Steps

Once everything is working:

1. **Customize Responses**
   - Edit `DineshVoiceAssistant.tsx`
   - Update the `processQuery` function
   - Add more navigation commands

2. **Add Admin Notifications**
   - Set up email alerts for new support requests
   - Add push notifications for urgent issues

3. **Enhanced Analytics**
   - Create reports on common queries
   - Track user satisfaction trends
   - Monitor response times

4. **Multi-language Support**
   - Add Tamil language support
   - Update voice recognition language

## Support

If you encounter issues:

1. Check `DINESH_VOICE_ASSISTANT.md` for detailed docs
2. Review troubleshooting section above
3. Check browser console for errors
4. Verify database tables exist

## Success Indicators

You'll know Dinesh is working when:

✅ Purple button visible on homepage  
✅ Voice commands navigate correctly  
✅ Support requests appear in admin  
✅ Feedback submissions work  
✅ Admin can respond to requests  
✅ No errors in browser console  

---

**You're all set! Dinesh is ready to help your customers! 🎙️**

Remember: Dinesh is separate from Shashti AI - it's specifically for voice-based navigation and support!
