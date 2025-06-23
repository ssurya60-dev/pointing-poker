import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SessionSetup from "./SessionSetup";
import PokerSession from "./PokerSession";
import { motion } from "framer-motion";
import { LogIn, Plus, Users, ArrowLeft, Sparkles } from "lucide-react";
import {
  createSession,
  joinSession,
  testDatabaseConnection,
  type Session,
  type Participant,
} from "@/lib/supabase";

interface SessionState {
  session: Session;
  participant: Participant;
}

const Home = () => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "create" | "join">(
    "landing",
  );
  const [dbConnectionStatus, setDbConnectionStatus] = useState<string | null>(
    null,
  );

  // Test database connection on component mount
  React.useEffect(() => {
    const testConnection = async () => {
      const result = await testDatabaseConnection();
      if (!result.success) {
        setDbConnectionStatus(`Database Error: ${result.error}`);
        console.error("Database connection failed:", result.error);
      } else {
        setDbConnectionStatus("Database connected successfully");
        console.log("Database connection successful");
      }
    };
    testConnection();
  }, []);

  const handleCreateSession = async (
    sessionName: string,
    userName: string,
    avatar?: string,
  ) => {
    console.log("handleCreateSession called with:", {
      sessionName,
      userName,
      avatar,
    });
    try {
      const { session, organizer } = await createSession(
        sessionName,
        userName,
        avatar,
      );
      console.log("Session created successfully:", { session, organizer });
      setSessionState({ session, participant: organizer });
    } catch (error) {
      console.error("Failed to create session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error details:", errorMessage);
      alert(`Failed to create session: ${errorMessage}`);
    }
  };

  const handleJoinSession = async (
    roomCode: string,
    userName: string,
    avatar?: string,
  ) => {
    console.log("handleJoinSession called with:", {
      roomCode,
      userName,
      avatar,
    });
    try {
      const { session, participant } = await joinSession(
        roomCode,
        userName,
        avatar,
      );
      console.log("Session joined successfully:", { session, participant });
      setSessionState({ session, participant });
    } catch (error) {
      console.error("Failed to join session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error details:", errorMessage);
      alert(`Failed to join session: ${errorMessage}`);
    }
  };

  const handleLeaveSession = () => {
    setSessionState(null);
    setCurrentView("landing");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <header className="border-b py-4 sm:py-6 px-4 sm:px-6 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div className="relative">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Planning Poker
            </h1>
          </motion.div>
          <div className="flex items-center gap-2">
            {currentView !== "landing" && !sessionState && (
              <Button
                variant="ghost"
                onClick={handleBackToLanding}
                className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            {sessionState && (
              <Button
                variant="outline"
                onClick={handleLeaveSession}
                className="border-red-200 text-red-600 hover:bg-red-50 text-sm sm:text-base"
                size="sm"
              >
                <span className="hidden sm:inline">Leave Session</span>
                <span className="sm:hidden">Leave</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-6 sm:py-8 lg:py-12 px-4">
        {!sessionState ? (
          <div className="max-w-4xl mx-auto">
            {currentView === "landing" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-12">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent px-4"
                  >
                    Welcome to Planning Poker
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4"
                  >
                    Collaborate with your team to estimate user stories in
                    real-time with our beautiful, intuitive planning poker
                    platform.
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group cursor-pointer"
                    onClick={() => setCurrentView("create")}
                  >
                    <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                          Create Session
                        </h3>
                        <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
                          Start a new planning poker session and invite your
                          team.
                        </p>
                        <Button
                          variant="secondary"
                          className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2 text-sm"
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group cursor-pointer"
                    onClick={() => setCurrentView("join")}
                  >
                    <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="bg-white/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-white/30 transition-colors">
                          <LogIn className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                          Join Session
                        </h3>
                        <p className="text-purple-100 mb-3 sm:mb-4 text-sm sm:text-base">
                          Enter a room code to join an existing session.
                        </p>
                        <Button
                          variant="secondary"
                          className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 py-2 text-sm"
                        >
                          Join Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-center mt-16"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-green-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3 sm:mb-4">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                        Real-time Collaboration
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        Work together seamlessly with live updates
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-yellow-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3 sm:mb-4">
                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                        Beautiful Interface
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        Modern design that makes estimation fun
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3 sm:mb-4">
                        <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                        Easy Setup
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        Get started in seconds with simple setup
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {(currentView === "create" || currentView === "join") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md mx-auto"
              >
                <SessionSetup
                  onCreateSession={handleCreateSession}
                  onJoinSession={handleJoinSession}
                  defaultTab={currentView}
                />
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <PokerSession
              sessionId={sessionState.session.id}
              currentParticipant={sessionState.participant}
              onLeaveSession={handleLeaveSession}
            />
          </motion.div>
        )}
      </main>
      <footer className="border-t py-6 px-6 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            Planning Poker Collaboration Platform
            <Sparkles className="h-4 w-4 text-yellow-500" />
            &copy; {new Date().getFullYear()}
          </p>
          {dbConnectionStatus && (
            <p
              className={`mt-2 text-xs ${
                dbConnectionStatus.includes("Error")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {dbConnectionStatus}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Home;
