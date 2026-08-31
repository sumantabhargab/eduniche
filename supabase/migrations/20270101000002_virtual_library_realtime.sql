-- Enable Supabase Realtime for virtual library multiplayer

ALTER PUBLICATION supabase_realtime ADD TABLE virtual_library_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE virtual_library_messages;
