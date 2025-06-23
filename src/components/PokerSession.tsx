import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import VotingDeck from "./VotingDeck";
import StoryManager from "./StoryManager";
import {
  supabase,
  getSessionData,
  updateParticipantVote,
  revealVotes,
  resetVotes,
  updateCurrentStory,
  removeParticipant,
  updateParticipantLastSeen,
  type Session,
  type Participant,
  type Story,
} from "@/lib/supabase";

interface PokerSessionProps {
  sessionId: string;
  currentParticipant: Participant;
  onLeaveSession?: () => void;
}

const PokerSession: React.FC<PokerSessionProps> = ({
  sessionId,
  currentParticipant,
  onLeaveSession = () => {},
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isOrganizer = currentParticipant?.is_organizer || false;
  const currentStory = stories[currentStoryIndex];
  const votesRevealed = session?.votes_revealed || false;
  const shareUrl = `${window.location.origin}?join=${session?.room_code}`;

  // Load initial session data
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const data = await getSessionData(sessionId);
        setSession(data.session);
        setParticipants(data.participants);
        setStories(data.stories);

        // Set current story index based on session's current_story_id
        if (data.session.current_story_id && data.stories.length > 0) {
          const storyIndex = data.stories.findIndex(
            (s) => s.id === data.session.current_story_id,
          );
          if (storyIndex >= 0) {
            setCurrentStoryIndex(storyIndex);
          }
        }
      } catch (error) {
        console.error("Failed to load session data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId]);

  // Set up real-time subscriptions
  useEffect(() => {
    const sessionChannel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setSession(payload.new as Session);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Reload participants when any participant changes
          const { data } = await supabase
            .from("participants")
            .select("*")
            .eq("session_id", sessionId)
            .order("joined_at");
          if (data) setParticipants(data);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Reload stories when any story changes
          const { data } = await supabase
            .from("stories")
            .select("*")
            .eq("session_id", sessionId)
            .order("order_index");
          if (data) setStories(data);
        },
      )
      .subscribe();

    // Update participant's last seen periodically
    const heartbeatInterval = setInterval(() => {
      if (currentParticipant?.id) {
        updateParticipantLastSeen(currentParticipant.id);
      }
    }, 30000); // Every 30 seconds

    return () => {
      sessionChannel.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [sessionId, currentParticipant?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Session not found</div>
      </div>
    );
  }

  const allVoted = participants
    .filter((p) => !p.is_organizer)
    .every((p) => p.has_voted);

  const handleVote = async (value: string) => {
    try {
      setSelectedVote(value);
      if (currentParticipant?.id) {
        await updateParticipantVote(currentParticipant.id, value);
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const handleRevealVotes = async () => {
    try {
      await revealVotes(sessionId);
    } catch (error) {
      console.error("Failed to reveal votes:", error);
    }
  };

  const handleResetVotes = async () => {
    try {
      setSelectedVote(null);
      await resetVotes(sessionId);
    } catch (error) {
      console.error("Failed to reset votes:", error);
    }
  };

  const handleNextStory = async () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      const nextStory = stories[nextIndex];
      setCurrentStoryIndex(nextIndex);
      await updateCurrentStory(sessionId, nextStory.id);
      await handleResetVotes();
    }
  };

  const handlePrevStory = async () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      const prevStory = stories[prevIndex];
      setCurrentStoryIndex(prevIndex);
      await updateCurrentStory(sessionId, prevStory.id);
      await handleResetVotes();
    }
  };

  const handleRemoveParticipant = async (id: string) => {
    try {
      await removeParticipant(id);
    } catch (error) {
      console.error("Failed to remove participant:", error);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    // In a real app, this would show a toast notification
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg sm:text-xl font-bold">Planning Poker</h1>
          <Badge variant="outline" className="ml-2 text-xs sm:text-sm">
            <span className="hidden sm:inline">Room: </span>
            {session.room_code}
          </Badge>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyShareUrl}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Copy Invite Link</span>
            <span className="sm:hidden">Copy</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Participants */}
        <div className="w-56 sm:w-64 border-r bg-muted/20 p-3 sm:p-4 hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">
                Participants ({participants.length})
              </h2>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-md bg-background"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-xs">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs sm:text-sm font-medium truncate max-w-20 sm:max-w-24">
                        {participant.name}
                      </p>
                      {participant.is_organizer && (
                        <Badge variant="secondary" className="text-xs">
                          Organizer
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {votesRevealed && participant.vote ? (
                      <Badge className="text-xs">{participant.vote}</Badge>
                    ) : (
                      <Badge
                        variant={participant.has_voted ? "default" : "outline"}
                        className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-xs"
                      >
                        {participant.has_voted ? "✓" : "?"}
                      </Badge>
                    )}
                    {isOrganizer && !participant.is_organizer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6 ml-1"
                        onClick={() => handleRemoveParticipant(participant.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Current Story and Voting */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-auto">
          {/* Current Story */}
          <Card className="mb-4">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-bold">
                  {currentStory?.title || "No story selected"}
                </h2>
                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevStory}
                    disabled={currentStoryIndex === 0}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    {currentStoryIndex + 1} of {stories.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextStory}
                    disabled={currentStoryIndex === stories.length - 1}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {currentStory?.description || "No description available"}
              </p>
              <Separator className="my-4" />

              {/* Voting Status */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <p className="text-sm font-medium">
                    {allVoted ? "Everyone has voted" : "Waiting for votes..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {participants.filter((p) => p.has_voted).length} of{" "}
                    {participants.length} voted
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Cards */}
          <VotingDeck
            isOrganizer={isOrganizer}
            onVote={handleVote}
            onReveal={handleRevealVotes}
            onReset={handleResetVotes}
            revealed={votesRevealed}
            selectedValue={selectedVote || ""}
            votingComplete={allVoted}
          />

          {/* Results (when revealed) */}
          {votesRevealed && (
            <Card className="mt-4 border-2 border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-green-800">
                  🎯 Voting Results
                </h3>

                {/* Individual Votes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {participants
                    .filter((participant) => !participant.is_organizer)
                    .map((participant) => {
                      const vote = participant.has_voted
                        ? participant.vote || "?"
                        : "-";
                      const isMajority = vote === "8"; // This would be calculated dynamically
                      return (
                        <div
                          key={participant.id}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            isMajority
                              ? "border-yellow-400 bg-yellow-100 shadow-lg transform scale-105"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <Avatar className="h-12 w-12 mb-2">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback className="text-sm font-semibold">
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <Badge
                            className={`text-lg font-bold px-3 py-1 mb-1 ${
                              isMajority
                                ? "bg-yellow-500 text-yellow-900 shadow-md"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {vote}
                            {isMajority && " 👑"}
                          </Badge>
                          <span className="text-sm font-medium text-center">
                            {participant.name.split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Results Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">
                    📊 Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        5.2
                      </div>
                      <div className="text-sm text-blue-800">Average</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                      <div className="text-2xl font-bold text-yellow-700">
                        8 👑
                      </div>
                      <div className="text-sm text-yellow-800">Most Voted</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        Medium
                      </div>
                      <div className="text-sm text-green-800">Consensus</div>
                    </div>
                  </div>

                  {/* Vote Distribution */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">
                      Vote Distribution:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-yellow-100 border-yellow-400 text-yellow-800 font-semibold"
                      >
                        8 points: 50% (2 votes) 👑
                      </Badge>
                      <Badge variant="outline" className="bg-gray-100">
                        5 points: 25% (1 vote)
                      </Badge>
                      <Badge variant="outline" className="bg-gray-100">
                        3 points: 25% (1 vote)
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Story Management */}
        <div className="w-72 sm:w-80 border-l bg-muted/20 p-3 sm:p-4 hidden lg:block">
          <div className="mb-4">
            <h2 className="font-semibold text-base sm:text-lg">Stories</h2>
          </div>
          <StoryManager
            sessionId={sessionId}
            stories={stories}
            currentStoryId={currentStory?.id}
            onSelectStory={async (id) => {
              const index = stories.findIndex((s) => s.id === id);
              if (index !== -1) {
                setCurrentStoryIndex(index);
                await updateCurrentStory(sessionId, id);
                await handleResetVotes();
              }
            }}
            isOrganizer={isOrganizer}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden border-t p-2 flex justify-around bg-white">
        <Button variant="ghost" size="sm" className="flex-col h-12 px-2">
          <Users className="h-4 w-4" />
          <span className="text-xs mt-1">Users</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-12 px-2"
          onClick={handlePrevStory}
          disabled={currentStoryIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs mt-1">Prev</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-12 px-2"
          onClick={handleNextStory}
          disabled={currentStoryIndex === stories.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="text-xs mt-1">Next</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-col h-12 px-2">
          <span className="text-xs">Stories</span>
        </Button>
      </div>
    </div>
  );
};

export default PokerSession;
