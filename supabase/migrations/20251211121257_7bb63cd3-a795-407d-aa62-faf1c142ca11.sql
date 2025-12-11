-- Add recipient column to feedback table
ALTER TABLE public.feedback ADD COLUMN recipient TEXT DEFAULT 'admin';

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create function to notify recipient when feedback is submitted
CREATE OR REPLACE FUNCTION public.notify_feedback_recipient()
RETURNS TRIGGER AS $$
DECLARE
  recipient_users UUID[];
  recipient_user UUID;
  feedback_subject TEXT;
BEGIN
  feedback_subject := NEW.subject;
  
  -- Get users with the recipient role
  SELECT ARRAY_AGG(ur.user_id) INTO recipient_users
  FROM public.user_roles ur
  WHERE ur.role = NEW.recipient::app_role;
  
  -- Create notification for each recipient
  IF recipient_users IS NOT NULL THEN
    FOREACH recipient_user IN ARRAY recipient_users
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, related_id, related_type)
      VALUES (
        recipient_user,
        'New Feedback Received',
        'New feedback: ' || feedback_subject,
        'feedback',
        NEW.id,
        'feedback'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for feedback notifications
CREATE TRIGGER on_feedback_created
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.notify_feedback_recipient();