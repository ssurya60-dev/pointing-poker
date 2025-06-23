import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");

    // Test if sessions table exists
    const { data: sessionsTest, error: sessionsError } = await supabase
      .from("sessions")
      .select("count")
      .limit(1);

    if (sessionsError) {
      console.error("Sessions table error:", sessionsError);
      return {
        success: false,
        error: `Sessions table: ${sessionsError.message}`,
      };
    }

    // Test if participants table exists
    const { data: participantsTest, error: participantsError } = await supabase
      .from("participants")
      .select("count")
      .limit(1);

    if (participantsError) {
      console.error("Participants table error:", participantsError);
      return {
        success: false,
        error: `Participants table: ${participantsError.message}`,
      };
    }

    // Test if stories table exists
    const { data: storiesTest, error: storiesError } = await supabase
      .from("stories")
      .select("count")
      .limit(1);

    if (storiesError) {
      console.error("Stories table error:", storiesError);
      return {
        success: false,
        error: `Stories table: ${storiesError.message}`,
      };
    }

    console.log("Database connection test successful");
    return { success: true };
  } catch (error) {
    console.error("Database connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export interface Session {
  id: string;
  room_code: string;
  name: string;
  organizer_id: string;
  current_story_id?: string;
  votes_revealed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  avatar?: string;
  is_organizer: boolean;
  has_voted: boolean;
  vote?: string;
  joined_at: string;
  last_seen: string;
}

export interface Story {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  status: "pending" | "estimated" | "completed";
  order_index: number;
  created_at: string;
}

// Session management functions
export const createSession = async (
  name: string,
  organizerName: string,
  organizerAvatar?: string,
) => {
  console.log("Creating session with:", {
    name,
    organizerName,
    organizerAvatar,
  });

  const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  console.log("Generated room code:", roomCode);

  // First create the participant (organizer)
  const { data: organizer, error: participantError } = await supabase
    .from("participants")
    .insert({
      session_id: null, // Will be updated after session creation
      name: organizerName,
      avatar: organizerAvatar,
      is_organizer: true,
      has_voted: false,
    })
    .select()
    .single();

  if (participantError) {
    console.error("Participant creation error:", participantError);
    console.error(
      "Participant error details:",
      JSON.stringify(participantError, null, 2),
    );
    throw new Error(`Failed to create organizer: ${participantError.message}`);
  }

  console.log("Organizer created:", organizer);

  // Now create the session with the valid organizer_id
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      room_code: roomCode,
      name,
      organizer_id: organizer.id, // Use the actual organizer ID
      votes_revealed: false,
    })
    .select()
    .single();

  if (sessionError) {
    console.error("Session creation error:", sessionError);
    console.error(
      "Session error details:",
      JSON.stringify(sessionError, null, 2),
    );
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  console.log("Session created:", session);

  // Update the participant with the session_id
  const { error: updateError } = await supabase
    .from("participants")
    .update({ session_id: session.id })
    .eq("id", organizer.id);

  if (updateError) {
    console.error("Participant update error:", updateError);
    console.error(
      "Update error details:",
      JSON.stringify(updateError, null, 2),
    );
    throw new Error(`Failed to update organizer: ${updateError.message}`);
  }

  console.log("Organizer updated with session_id");
  return { session, organizer: { ...organizer, session_id: session.id } };
};

export const joinSession = async (
  roomCode: string,
  participantName: string,
  participantAvatar?: string,
) => {
  console.log("Joining session with:", {
    roomCode,
    participantName,
    participantAvatar,
  });

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .single();

  if (sessionError) {
    console.error("Session lookup error:", sessionError);
    console.error(
      "Session lookup error details:",
      JSON.stringify(sessionError, null, 2),
    );
    throw new Error(`Session not found: ${sessionError.message}`);
  }

  console.log("Session found:", session);

  // Check if participant with same name already exists
  const { data: existingParticipant, error: checkError } = await supabase
    .from("participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("name", participantName)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking existing participant:", checkError);
  }

  if (existingParticipant) {
    console.log("Participant already exists:", existingParticipant);
    throw new Error(
      "A participant with this name already exists in the session",
    );
  }

  console.log("Creating new participant");
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({
      session_id: session.id,
      name: participantName,
      avatar: participantAvatar,
      is_organizer: false,
      has_voted: false,
    })
    .select()
    .single();

  if (participantError) {
    console.error("Participant creation error:", participantError);
    console.error(
      "Participant error details:",
      JSON.stringify(participantError, null, 2),
    );
    throw new Error(`Failed to join session: ${participantError.message}`);
  }

  console.log("Participant created:", participant);
  return { session, participant };
};

export const getSessionData = async (sessionId: string) => {
  const [sessionResult, participantsResult, storiesResult] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", sessionId).single(),
    supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("joined_at"),
    supabase
      .from("stories")
      .select("*")
      .eq("session_id", sessionId)
      .order("order_index"),
  ]);

  return {
    session: sessionResult.data,
    participants: participantsResult.data || [],
    stories: storiesResult.data || [],
  };
};

export const updateParticipantVote = async (
  participantId: string,
  vote: string,
) => {
  const { error } = await supabase
    .from("participants")
    .update({ vote, has_voted: true })
    .eq("id", participantId);

  if (error) throw error;
};

export const revealVotes = async (sessionId: string) => {
  const { error } = await supabase
    .from("sessions")
    .update({ votes_revealed: true })
    .eq("id", sessionId);

  if (error) throw error;
};

export const resetVotes = async (sessionId: string) => {
  const [sessionUpdate, participantsUpdate] = await Promise.all([
    supabase
      .from("sessions")
      .update({ votes_revealed: false })
      .eq("id", sessionId),
    supabase
      .from("participants")
      .update({ vote: null, has_voted: false })
      .eq("session_id", sessionId),
  ]);

  if (sessionUpdate.error) throw sessionUpdate.error;
  if (participantsUpdate.error) throw participantsUpdate.error;
};

export const addStory = async (
  sessionId: string,
  title: string,
  description?: string,
) => {
  const { data: stories } = await supabase
    .from("stories")
    .select("order_index")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrderIndex =
    stories && stories.length > 0 ? stories[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from("stories")
    .insert({
      session_id: sessionId,
      title,
      description,
      order_index: nextOrderIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStory = async (storyId: string, updates: Partial<Story>) => {
  const { error } = await supabase
    .from("stories")
    .update(updates)
    .eq("id", storyId);

  if (error) throw error;
};

export const deleteStory = async (storyId: string) => {
  const { error } = await supabase.from("stories").delete().eq("id", storyId);

  if (error) throw error;
};

export const updateCurrentStory = async (
  sessionId: string,
  storyId: string,
) => {
  const { error } = await supabase
    .from("sessions")
    .update({ current_story_id: storyId })
    .eq("id", sessionId);

  if (error) throw error;
};

export const removeParticipant = async (participantId: string) => {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", participantId);

  if (error) throw error;
};

export const updateParticipantLastSeen = async (participantId: string) => {
  const { error } = await supabase
    .from("participants")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", participantId);

  if (error) throw error;
};
