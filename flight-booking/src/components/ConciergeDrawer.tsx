'use client';

import { useState } from 'react';
import { FlightItem } from './FlightList';

interface ConciergeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlight: (flight: FlightItem) => void;
}

export default function ConciergeDrawer({
  isOpen,
  onClose,
  onSelectFlight,
}: ConciergeDrawerProps) {
  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    recommendation: string;
    relevantGuides?: Array<{
      id: string;
      city: string;
      country: string;
      content: string;
      similarity: number;
    }>;
    matchingFlights?: FlightItem[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'Cultural weekend in Cairo & Pyramids under $600',
    'Luxury shopping & modern architecture in Dubai',
    'Direct flight to London for art and theater',
    'Transatlantic trip to New York City',
  ];

  const handleQuery = async (customPrompt?: string) => {
    const queryText = customPrompt || prompt;
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText.trim(),
          budget: budget ? parseFloat(budget) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to consult travel concierge.');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Concierge inquiry failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1c1a14]/50 backdrop-blur-xs">
      <div className="bg-[#f3ecd6] w-full max-w-2xl h-full border-l border-[rgba(28,26,20,0.18)] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="notary-mark" />
              <h3 className="font-display text-2xl font-normal text-[#1c1a14]">
                AeroFlow AI Concierge
              </h3>
            </div>
            <p className="text-xs font-mono text-[#6b6759] mt-0.5">
              SEMANTIC VECTOR RETRIEVAL • GEMINI EMBEDDINGS (768D)
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-outline !py-1.5 !px-3 text-xs cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Prompts */}
          <div>
            <span className="ui-caption text-[#6b6759] block mb-2 font-mono">
              CURATED INQUIRIES
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(qp);
                    handleQuery(qp);
                  }}
                  className="text-xs font-mono px-3 py-1.5 bg-[#ebe4cf] border border-[rgba(28,26,20,0.12)] hover:border-[#1c1a14] text-[#1c1a14] rounded-[2px] transition-colors cursor-pointer text-left"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Search Inputs */}
          <div className="border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] p-4 rounded-[3px] space-y-3">
            <div>
              <label className="ui-caption text-[#6b6759] block mb-1 font-mono">
                TRAVEL DESIRES & CONSTRAINTS
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your travel vision (e.g. 'I seek a refined seaside destination with historic architecture under $600')..."
                className="w-full bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] p-3 rounded-[3px] text-sm focus:outline-none focus:border-[#1c1a14] resize-none"
              />
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Max Budget (USD, optional)"
                  className="w-full bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-3 py-2 rounded-[3px] text-xs font-mono focus:outline-none focus:border-[#1c1a14]"
                />
              </div>
              <button
                onClick={() => handleQuery()}
                disabled={loading || !prompt.trim()}
                className="btn-primary !py-2.5 !px-6 cursor-pointer text-xs"
              >
                {loading ? 'ANALYZING...' : 'ADVISE ME'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-[3px] text-xs font-mono">
              ■ ADVISORY ERROR: {error}
            </div>
          )}

          {/* AI Recommendation Result */}
          {result && (
            <div className="space-y-6 pt-4 border-t border-[rgba(28,26,20,0.12)]">
              {/* Advisor Note */}
              <div className="bg-[#ebe4cf] border-l-4 border-[#244232] p-5 rounded-r-[3px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="notary-mark" />
                  <span className="ui-caption text-[#244232] font-semibold">
                    CONCIERGE ADVISORY NOTE
                  </span>
                </div>
                <p className="font-display text-lg text-[#1c1a14] italic leading-relaxed">
                  &ldquo;{result.recommendation}&rdquo;
                </p>
              </div>

              {/* Semantic Destination Context */}
              {result.relevantGuides && result.relevantGuides.length > 0 && (
                <div>
                  <span className="ui-caption text-[#6b6759] block mb-2 font-mono">
                    SEMANTIC VECTOR MATCHES (DESTINATION GUIDES)
                  </span>
                  <div className="space-y-3">
                    {result.relevantGuides.map((guide) => (
                      <div
                        key={guide.id}
                        className="bg-[#f3ecd6] border border-[rgba(28,26,20,0.12)] p-4 rounded-[3px]"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-display text-base font-semibold text-[#1c1a14]">
                            {guide.city}, {guide.country}
                          </span>
                          <span className="text-[10px] font-mono text-[#244232] bg-[#ebe4cf] px-2 py-0.5 rounded-[2px]">
                            {(guide.similarity * 100).toFixed(1)}% COSINE MATCH
                          </span>
                        </div>
                        <p className="text-xs text-[#6b6759] leading-relaxed line-clamp-2">
                          {guide.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Flights */}
              {result.matchingFlights && result.matchingFlights.length > 0 && (
                <div>
                  <span className="ui-caption text-[#6b6759] block mb-2 font-mono">
                    MATCHING SCHEDULED FLIGHTS
                  </span>
                  <div className="space-y-3">
                    {result.matchingFlights.map((flight: any) => (
                      <div
                        key={flight.id}
                        className="bg-[#ebe4cf] border border-[rgba(28,26,20,0.12)] p-4 rounded-[3px] flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-[#1c1a14]">
                            {flight.flightNumber} • {flight.origin?.code || flight.originCode} → {flight.destination?.code || flight.destinationCode}
                          </div>
                          <div className="text-xs text-[#6b6759] font-mono mt-0.5">
                            Fare: ${parseFloat(flight.basePrice).toFixed(0)} USD
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onSelectFlight(flight);
                            onClose();
                          }}
                          className="btn-primary !py-2 !px-4 text-xs cursor-pointer whitespace-nowrap"
                        >
                          BOOK THIS FLIGHT
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
