# Dinesh Voice Assistant System

## Overview

**Dinesh** is a voice assistant for customers of Shashti Karz car detailing platform. It's completely separate from Shashti AI (the AI chatbot) and provides voice-based navigation, support, and feedback capabilities.

## Features

### 1. **Voice Recognition & Speech Synthesis**
- Real-time voice recognition using Web Speech API
- Text-to-speech responses for hands-free interaction
- Fallback to text input for accessibility

### 2. **Smart Navigation**
- Voice-guided navigation to different pages
- Understands natural language commands
- Provides context-aware responses

### 3. **Support Request System**
- Customers can raise support requests via voice or text
- Categorized support tickets (navigation, service info, booking help, technical, general)
- Priority levels (low, medium, high, urgent)
- Conversation history tracking
- Admin dashboard for response management

### 4. **Feedback Collection**
- Multiple feedback types (suggestion, compliment, complaint, feature request, bug report)
- Rating and satisfaction scoring
- Category-based organization
- Admin review and acknowledgment system

### 5. **Interaction Logging**
- All interactions logged for analytics
- Intent detection and confidence scoring
- Session-based tracking
- Performance metrics

## Components

### Customer-Facing

1. **DineshVoiceAssistant.tsx** (`src/components/DineshVoiceAssistant.tsx`)
   - Main voice assistant interface
   - Floating button on bottom-left
   - Chat window with voice/text input
   - Speech recognition and synthesis
   - Smart query processing

2. **SupportRequestForm.tsx** (`src/components/dinesh/SupportRequestForm.tsx`)
   - Form for creating support requests
   - Validation and submission
   - Success/error feedback

3. **CustomerFeedbackForm.tsx** (`src/components/dinesh/CustomerFeedbackForm.tsx`)
   - Feedback submission form
   - Rating system
   - Satisfaction scoring

### Admin-Facing

1. **Dinesh Support Admin** (`src/app/admin/dinesh-support/page.tsx`)
   - Support requests management
   - Feedback review system
   - Analytics and statistics
   - Response interface with conversation tracking

## API Routes

### Support Requests

- **GET /api/support** - List all support requests (with filters)
  - Query params: `status`, `priority`
  
- **POST /api/support** - Create new support request
  - Body: `customer_name`, `customer_email`, `customer_phone`, `category`, `subject`, `message`, `priority`

- **PATCH /api/support/[id]** - Update support request (Admin only)
  - Body: `status`, `priority`, `admin_response`, `conversation_message`

### Feedback

- **GET /api/feedback** - List all feedback (with filters)
  - Query params: `status`, `type`
  
- **POST /api/feedback** - Create new feedback
  - Body: `customer_name`, `customer_email`, `feedback_type`, `category`, `rating`, `message`, `satisfaction_score`, `would_recommend`

## Database Schema

### Tables

1. **support_requests**
   - Support ticket management
   - Status tracking (pending, in_progress, resolved, closed)
   - Priority levels
   - Conversation history
   - Admin responses

2. **customer_feedback_dinesh**
   - Customer feedback storage
   - Rating and satisfaction metrics
   - Category and type classification
   - Admin notes and review status

3. **dinesh_interactions**
   - Interaction logging
   - Intent detection
   - Performance tracking
   - Session management

4. **support_request_attachments**
   - File attachments for support requests (future use)

## Usage

### For Customers

1. **Accessing Dinesh**
   - Click the purple floating button on the bottom-left
   - The assistant greets you and is ready to help

2. **Voice Commands**
   - Click the microphone button and speak
   - Examples:
     - "Take me to the booking page"
     - "Show me your services"
     - "What are your prices?"
     - "I need help with my booking"
     - "I want to give feedback"

3. **Text Input**
   - Type your question in the input box
   - Press Send or Enter

4. **Getting Support**
   - Say "I need support" or "I have an issue"
   - Dinesh will guide you to create a support request

5. **Providing Feedback**
   - Say "I want to give feedback"
   - Fill out the feedback form

### For Admins

1. **Access Admin Dashboard**
   - Navigate to `/admin/dinesh-support`
   - View all support requests and feedback

2. **Managing Support Requests**
   - Click on any request to view details
   - Add admin response
   - Update status (pending → in_progress → resolved → closed)
   - Change priority if needed

3. **Reviewing Feedback**
   - Switch to Feedback tab
   - Click on feedback to review
   - Add admin notes
   - Update status (new → reviewed → acknowledged → implemented)

## Voice Commands Dinesh Understands

### Navigation
- "Take me to home/homepage"
- "Open booking page"
- "Show me services"
- "Go to contact page"
- "Open my profile"
- "Show my bookings"
- "Track my order"
- "Show rewards/loyalty points"

### Information Queries
- "What services do you offer?"
- "How long does it take?"
- "Tell me about ceramic coating"
- "What are your hours?"
- "Where are you located?"
- "How can I pay?"

### Support & Feedback
- "I need help/support"
- "I have an issue/problem"
- "I want to give feedback"
- "I have a suggestion"
- "I want to complain"

### General
- "What can you do?"
- "Help me"

## Integration Points

### Page Integration

Dinesh is integrated into:
- **Homepage** (`src/app/page.tsx`) - Main customer entry point
- Can be added to any customer-facing page by importing and rendering the component

### Difference from Shashti AI

| Feature | Shashti AI | Dinesh |
|---------|-----------|--------|
| **Purpose** | Service recommendations, booking assistance | Voice navigation, support, feedback |
| **Interface** | Text-based chatbot | Voice + Text assistant |
| **Location** | Bottom-right floating button | Bottom-left floating button |
| **Main Function** | AI-powered service suggestions | Navigation and support |
| **Interaction** | Chat conversations | Voice commands + chat |

## Setup Instructions

### 1. Database Setup

Run the SQL migration:
```bash
# Using Supabase CLI or SQL editor
psql -f sql/dinesh_voice_assistant.sql
# OR in Supabase dashboard, run the SQL file
```

### 2. Environment Variables

No additional environment variables needed. Uses existing Supabase configuration.

### 3. Test the Installation

1. Visit the homepage
2. Click the purple Dinesh button (bottom-left)
3. Try saying "What can you do?"
4. Try creating a support request
5. Check admin dashboard at `/admin/dinesh-support`

## Browser Compatibility

### Voice Features
- **Chrome/Edge**: Full support ✅
- **Safari**: Partial support (iOS 14.5+) ⚠️
- **Firefox**: Limited support ⚠️

### Fallback Behavior
- If voice is not supported, text input is always available
- Speech synthesis can be muted
- All functionality works via text as well

## Future Enhancements

1. **Multi-language Support**
   - Support for Tamil, Hindi, and other Indian languages
   - Language switching in voice assistant

2. **Advanced Intent Recognition**
   - Integration with NLP services
   - Better context understanding
   - Multi-turn conversations

3. **WhatsApp Integration**
   - Support requests via WhatsApp
   - Voice messages support

4. **Analytics Dashboard**
   - Common queries analytics
   - User satisfaction metrics
   - Performance insights

5. **Proactive Assistance**
   - Help based on user behavior
   - Contextual suggestions
   - Onboarding tours

## Troubleshooting

### Voice Not Working

1. **Check Microphone Permissions**
   - Browser must have microphone access
   - Check browser settings

2. **HTTPS Required**
   - Voice API only works on HTTPS or localhost

3. **Browser Support**
   - Use Chrome/Edge for best experience

### Common Issues

**Issue**: Dinesh doesn't speak
- **Solution**: Unmute the assistant (volume icon)

**Issue**: Voice recognition stops immediately
- **Solution**: Speak clearly and check microphone

**Issue**: Can't submit support request
- **Solution**: Check required fields (name, category, subject, message)

## Analytics & Monitoring

### Key Metrics

- Total interactions
- Support request volume
- Average response time
- Customer satisfaction score
- Common query patterns
- Intent detection accuracy

### Database Queries

```sql
-- Get support analytics
SELECT get_support_analytics('2024-01-01'::timestamptz);

-- Top interaction types
SELECT interaction_type, COUNT(*) as total
FROM dinesh_interactions
GROUP BY interaction_type
ORDER BY total DESC;

-- Feedback by type
SELECT feedback_type, COUNT(*) as total, AVG(satisfaction_score) as avg_satisfaction
FROM customer_feedback_dinesh
GROUP BY feedback_type;
```

## Security Considerations

1. **Row Level Security (RLS)**
   - Enabled on all tables
   - Users can only see their own data
   - Admins have full access

2. **Authentication**
   - Support requests can be created without auth (guest support)
   - User-linked if authenticated
   - Admin actions require admin role

3. **Input Validation**
   - All inputs validated on API level
   - SQL injection prevention
   - XSS protection

## Support

For issues or feature requests related to Dinesh:
1. Check this documentation
2. Review the code comments
3. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintained By**: Shashti Karz Development Team
