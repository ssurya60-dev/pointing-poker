import React, { useState } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Story {
  id: string;
  title: string;
  description: string;
  status: "pending" | "estimated" | "completed";
}

interface StoryManagerProps {
  sessionId: string;
  stories: Story[];
  isOrganizer?: boolean;
  currentStoryId?: string;
  onSelectStory?: (storyId: string) => void;
}

import {
  addStory,
  updateStory,
  deleteStory,
  type Story as DBStory,
} from "@/lib/supabase";

const StoryManager = ({
  sessionId,
  stories: externalStories = [],
  isOrganizer = true,
  currentStoryId = "",
  onSelectStory = () => {},
}: StoryManagerProps) => {
  const stories = externalStories;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [newStory, setNewStory] = useState<Omit<Story, "id">>({
    title: "",
    description: "",
    status: "pending",
  });

  const handleAddStory = async () => {
    if (newStory.title.trim() === "") return;

    try {
      await addStory(sessionId, newStory.title, newStory.description);
      setNewStory({ title: "", description: "", status: "pending" });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add story:", error);
    }
  };

  const handleEditStory = async () => {
    if (!editingStory || editingStory.title.trim() === "") return;

    try {
      await updateStory(editingStory.id, {
        title: editingStory.title,
        description: editingStory.description,
        status: editingStory.status,
      });
      setIsEditDialogOpen(false);
      setEditingStory(null);
    } catch (error) {
      console.error("Failed to edit story:", error);
    }
  };

  const handleDeleteStory = async (id: string) => {
    try {
      await deleteStory(id);
    } catch (error) {
      console.error("Failed to delete story:", error);
    }
  };

  const moveStory = async (id: string, direction: "up" | "down") => {
    const index = stories.findIndex((story) => story.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === stories.length - 1)
    )
      return;

    const currentStory = stories[index];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const targetStory = stories[targetIndex];

    try {
      // Swap order_index values
      await Promise.all([
        updateStory(currentStory.id, { order_index: targetStory.order_index }),
        updateStory(targetStory.id, { order_index: currentStory.order_index }),
      ]);
    } catch (error) {
      console.error("Failed to reorder stories:", error);
    }
  };

  const getStatusColor = (status: Story["status"]) => {
    switch (status) {
      case "estimated":
        return "secondary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Card className="w-full max-w-md bg-background h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>User Stories</span>
          {isOrganizer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[500px] pr-4">
          {stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stories added yet. Click the + button to add a story.
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`p-3 border rounded-md ${story.id === currentStoryId ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => onSelectStory(story.id)}
                      >
                        {story.title}
                      </h3>
                      <Badge
                        variant={getStatusColor(story.status) as any}
                        className="mt-1"
                      >
                        {story.status.charAt(0).toUpperCase() +
                          story.status.slice(1)}
                      </Badge>
                    </div>
                    {isOrganizer && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveStory(story.id, "up")}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveStory(story.id, "down")}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingStory(story);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStory(story.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {story.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {story.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4">
        <div className="text-sm text-muted-foreground">
          {stories.length} {stories.length === 1 ? "story" : "stories"} total
        </div>
      </CardFooter>

      {/* Add Story Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={newStory.title}
                onChange={(e) =>
                  setNewStory({ ...newStory, title: e.target.value })
                }
                placeholder="Enter story title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={newStory.description}
                onChange={(e) =>
                  setNewStory({ ...newStory, description: e.target.value })
                }
                placeholder="Enter story description"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStory}>Add Story</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Story Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
          </DialogHeader>
          {editingStory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="edit-title"
                  value={editingStory.title}
                  onChange={(e) =>
                    setEditingStory({ ...editingStory, title: e.target.value })
                  }
                  placeholder="Enter story title"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Textarea
                  id="edit-description"
                  value={editingStory.description}
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter story description"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-2">
                  {(["pending", "estimated", "completed"] as const).map(
                    (status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={
                          editingStory.status === status ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setEditingStory({ ...editingStory, status })
                        }
                        className="capitalize"
                      >
                        {status === editingStory.status && (
                          <Check className="mr-1 h-4 w-4" />
                        )}
                        {status}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditStory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StoryManager;
