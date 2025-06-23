import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

interface VotingDeckProps {
  isOrganizer?: boolean;
  onVote?: (value: string) => void;
  onReveal?: () => void;
  onReset?: () => void;
  revealed?: boolean;
  selectedValue?: string;
  votingComplete?: boolean;
}

const VotingDeck: React.FC<VotingDeckProps> = ({
  isOrganizer = false,
  onVote = () => {},
  onReveal = () => {},
  onReset = () => {},
  revealed = false,
  selectedValue = "",
  votingComplete = false,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Fibonacci sequence for planning poker
  const cardValues = ["1", "2", "3", "5", "8", "13", "21", "?", "☕"];

  const handleCardClick = (value: string) => {
    if (!isOrganizer && !revealed) {
      onVote(value);
    }
  };

  return (
    <div className="w-full bg-background p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-medium">
          Select Your Estimate
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
        {cardValues.map((value) => (
          <motion.div
            key={value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredCard(value)}
            onHoverEnd={() => setHoveredCard(null)}
          >
            <Card
              className={`cursor-pointer flex flex-col items-center justify-center h-16 sm:h-20 lg:h-24 transition-all ${selectedValue === value ? "ring-2 ring-primary" : ""} ${isOrganizer && !revealed ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleCardClick(value)}
            >
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {value}
              </div>
              {selectedValue === value && (
                <Badge variant="secondary" className="mt-1 sm:mt-2 text-xs">
                  <span className="hidden sm:inline">Selected</span>
                  <span className="sm:hidden">✓</span>
                </Badge>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {!isOrganizer && (
        <div className="mt-4 text-sm text-muted-foreground">
          {selectedValue ? (
            <p>You selected: {selectedValue}</p>
          ) : (
            <p>Click on a card to cast your vote</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VotingDeck;
