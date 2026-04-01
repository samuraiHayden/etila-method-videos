-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for message_threads table
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;