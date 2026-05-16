import { styles } from "./Game.styles";
import { COLORS, getCardColor } from "./constants";

import type { CardInfo } from "../../../util/types";
import type { Dispatch, SetStateAction } from "react";

interface CardProps {
  card: CardInfo;
  index: number;
  isOwnCard: boolean;
  selectedCard: number;
  setSelectedCard: Dispatch<SetStateAction<number>>;
}

export function Card({
  card,
  index,
  isOwnCard,
  selectedCard,
  setSelectedCard,
}: CardProps) {
  const isSelected = selectedCard === index && isOwnCard;

  return (
    <div
      key={index}
      style={{
        ...styles.card,
        ...(isOwnCard ? styles.ownCard : styles.otherCard),
        ...(isSelected ? styles.cardSelected : {}),
        backgroundColor: isOwnCard ? "#ccc" : getCardColor(card.color),
        cursor: isOwnCard ? "pointer" : "not-allowed",
      }}
      onClick={() => isOwnCard && setSelectedCard(index)}
    >
      <>
        {!isOwnCard && <div style={styles.cardRank}>{card.rank}</div>}
        {/* superimposed hint info */}
        {(card.rankKnown || card.colorKnown) && (
          <div style={styles.cardKnownInfo}>
            {card.rankKnown && `${card.rank}`}
            {card.rankKnown && card.colorKnown && " "}
            {card.colorKnown && COLORS[card.color][0]}
          </div>
        )}
      </>
    </div>
  );
}
