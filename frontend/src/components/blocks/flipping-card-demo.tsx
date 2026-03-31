import { FlippingCard } from "@/components/ui/flipping-card";
import { useNavigate } from "react-router-dom";

interface CardData {
  id: string;
  front: {
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
  };
  back: {
    description: string;
    buttonText: string;
    actionPath: string;
  };
}

const cardsData: CardData[] = [
  {
    id: "create-room",
    front: {
      imageSrc:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=300&fit=crop",
      imageAlt: "Debaters discussing in a structured forum",
      title: "Start the Debate",
      description:
        "Set the topic. Control the rules. Let others prove themselves.",
    },
    back: {
      description:
        "Define sides, add AI challengers, and enforce structured turns. You run the arena.",
      buttonText: "Create Room",
      actionPath: "/rooms",
    },
  },
  {
    id: "join-room",
    front: {
      imageSrc:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop",
      imageAlt: "Participants entering a live discussion",
      title: "Enter the Arena",
      description: "Step into live debates and defend your position.",
    },
    back: {
      description:
        "Choose a side, respond under pressure, and win through logic — not noise.",
      buttonText: "Join Now",
      actionPath: "/rooms",
    },
  },
];

export default function FlippingCardDemo() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-10 p-8">
      {cardsData.map((card) => (
        <FlippingCard
          key={card.id}
          width={300}
          frontContent={<GenericCardFront data={card.front} />}
          backContent={
            <GenericCardBack
              data={card.back}
              onAction={() => navigate(card.back.actionPath)}
            />
          }
        />
      ))}
    </div>
  );
}

interface GenericCardFrontProps {
  data: CardData["front"];
}

function GenericCardFront({ data }: GenericCardFrontProps) {
  return (
    <div className="flex flex-col h-full w-full p-4">
      <img
        src={data.imageSrc}
        alt={data.imageAlt}
        className="w-full h-auto object-cover flex-grow min-h-0 rounded-md"
      />
      <div className="p-2">
        <h3 className="text-base font-semibold mt-2">{data.title}</h3>
        <p className="text-[13.5px] mt-2 text-muted-foreground">
          {data.description}
        </p>
      </div>
    </div>
  );
}

interface GenericCardBackProps {
  data: CardData["back"];
  onAction: () => void;
}

function GenericCardBack({ data, onAction }: GenericCardBackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6">
      <p className="text-[13.5px] mt-2 text-muted-foreground text-center">
        {data.description}
      </p>
      <button
        onClick={onAction}
        className="mt-6 bg-foreground text-background px-4 py-2 rounded-md text-[13.5px] w-min whitespace-nowrap h-8 flex items-center justify-center"
      >
        {data.buttonText}
      </button>
    </div>
  );
}
