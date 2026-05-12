import React from "react"

import type { VotingDetail } from "~lib/types"

import { ConfidenceBadge } from "./ConfidenceBadge"

interface ModelVotesProps {
  votingDetails: VotingDetail[]
}

export const ModelVotes: React.FC<ModelVotesProps> = ({ votingDetails }) => {
  return (
    <div className="naurok-votes-list">
      {votingDetails.map((detail, i) => (
        <div
          key={i}
          className={`naurok-vote-item ${i === 0 ? "naurok-vote-winner" : ""}`}>
          <div className="naurok-vote-answer">
            <p className="naurok-vote-text">{detail.answer}</p>
            <div className="naurok-vote-models">
              {detail.models.map((model) => (
                <span key={model} className="naurok-vote-model-tag">
                  {model}
                </span>
              ))}
            </div>
          </div>
          <div className="naurok-vote-meta">
            <span className="naurok-vote-count">
              {detail.votes} vote{detail.votes > 1 ? "s" : ""}
            </span>
            <ConfidenceBadge confidence={detail.avgConfidence} size="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}
