'use client';

import { useState } from 'react';

export interface AirportOption {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

interface FlightSearchProps {
  airports: AirportOption[];
  onSearch: (filters: { origin: string; destination: string; date: string }) => void;
  isLoading?: boolean;
}

export default function FlightSearch({
  airports,
  onSearch,
  isLoading,
}: FlightSearchProps) {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ origin, destination, date });
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    onSearch({ origin: '', destination: '', date: '' });
  };

  return (
    <div id="schedule" className="bg-[#ebe4cf] border border-[rgba(28,26,20,0.12)] p-6 md:p-8 rounded-[4px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[rgba(28,26,20,0.12)]">
        <div className="flex items-center gap-3">
          <span className="notary-mark" />
          <h2 className="font-display text-2xl font-normal text-[#1c1a14]">
            Carrier Schedule & Flight Query
          </h2>
        </div>
        <span className="ui-caption text-[#6b6759]">
          EXHIBIT 01 // DIRECT FLEET DISPATCH
        </span>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Origin */}
        <div>
          <label className="ui-caption text-[#6b6759] block mb-2 font-mono">
            ORIGIN PORT (FROM)
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-4 py-3 rounded-[3px] text-sm focus:outline-none focus:border-[#1c1a14] transition-colors"
          >
            <option value="">All Departure Ports</option>
            {airports.map((airport) => (
              <option key={airport.id} value={airport.code}>
                {airport.city} ({airport.code}) — {airport.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="ui-caption text-[#6b6759] block mb-2 font-mono">
            DESTINATION PORT (TO)
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-4 py-3 rounded-[3px] text-sm focus:outline-none focus:border-[#1c1a14] transition-colors"
          >
            <option value="">All Arrival Ports</option>
            {airports.map((airport) => (
              <option key={airport.id} value={airport.code}>
                {airport.city} ({airport.code}) — {airport.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="ui-caption text-[#6b6759] block mb-2 font-mono">
            DEPARTURE DATE
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-4 py-3 rounded-[3px] text-sm focus:outline-none focus:border-[#1c1a14] transition-colors font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 !py-3 cursor-pointer"
          >
            {isLoading ? 'SEARCHING...' : 'FIND FLIGHTS'}
          </button>
          {(origin || destination || date) && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-outline !py-3 !px-3 cursor-pointer text-xs"
              title="Reset Filters"
            >
              CLEAR
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
