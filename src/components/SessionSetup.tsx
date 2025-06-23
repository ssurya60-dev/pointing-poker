import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users, Plus, LogIn } from "lucide-react";

interface SessionSetupProps {
  onCreateSession?: (
    sessionName: string,
    userName: string,
    avatar?: string,
  ) => void;
  onJoinSession?: (roomCode: string, userName: string, avatar?: string) => void;
  defaultTab?: "create" | "join";
}

const SessionSetup = ({
  onCreateSession = () => {},
  onJoinSession = () => {},
  defaultTab = "create",
}: SessionSetupProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sessionName, setSessionName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [userName, setUserName] = useState("");
  const handleCreateSession = () => {
    if (sessionName.trim() && userName.trim()) {
      onCreateSession(sessionName, userName);
    }
  };

  const handleJoinSession = () => {
    if (roomCode.trim() && userName.trim()) {
      onJoinSession(roomCode, userName);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {activeTab === "create" ? "Create New Session" : "Join Session"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {activeTab === "create"
              ? "Set up a new planning poker session for your team"
              : "Enter the details to join an existing session"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="create"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create
              </TabsTrigger>
              <TabsTrigger
                value="join"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white font-medium"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Join
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  placeholder="My Planning Session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="room-code">Room Code</Label>
                <Input
                  id="room-code"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* User information section - common to both tabs */}
            <div className="space-y-4 mt-6 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Your Name</Label>
                <Input
                  id="user-name"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
            </div>
          </Tabs>
        </CardContent>

        <CardFooter>
          <Button
            className={`w-full font-semibold py-3 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
              activeTab === "create"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            }`}
            onClick={
              activeTab === "create" ? handleCreateSession : handleJoinSession
            }
            disabled={
              (activeTab === "create" &&
                (!sessionName.trim() || !userName.trim())) ||
              (activeTab === "join" && (!roomCode.trim() || !userName.trim()))
            }
          >
            {activeTab === "create" ? (
              <>
                <Users className="mr-2 h-5 w-5" />
                Create Session
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Join Session
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SessionSetup;
