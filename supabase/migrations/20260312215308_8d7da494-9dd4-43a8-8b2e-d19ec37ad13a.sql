ALTER TABLE public.session_types 
  ADD COLUMN notification_email_1 text DEFAULT NULL,
  ADD COLUMN notification_email_2 text DEFAULT NULL,
  ADD COLUMN show_second_email boolean NOT NULL DEFAULT false;