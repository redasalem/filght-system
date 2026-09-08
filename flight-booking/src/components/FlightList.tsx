'use client';

export interface FlightItem {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: string;
  seatsAvailable: number;
  totalSeats: number;
  origin: {
    id: string;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    id: string;
    code: string;
    name: string;
    city: string;
    country: string;
  };
  aircraft?: {
    id: string;
    model: string;
    totalSeats: number;
  };
}

interface FlightListProps {
  flights: FlightItem[];
  isLoading: boolean;
  onSelectFlight: (flight: FlightItem) => void;
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function calculateDuration(depIso: string, arrIso: string): string {
  try {
    const dep = new Date(depIso).getTime();
    const arr = new Date(arrIso).getTime();
    const diffMs = arr - dep;
    if (diffMs <= 0) return 'Direct';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  } catch {
    return 'Non-stop';
  }
}

export default function FlightList({
  flights,
  isLoading,
  onSelectFlight,
}: FlightListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-8 border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] rounded-[4px] animate-pulse h-40"
          />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-20 px-6 border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] rounded-[4px] my-8">
        <span className="notary-mark mb-3" />
        <h3 className="font-display text-2xl text-[#1c1a14] mb-2 font-normal">
          No Scheduled Direct Flights Found
        </h3>
        <p className="text-[#6b6759] text-sm max-w-md mx-auto leading-relaxed">
          No carrier dispatches match your selected ports and date. Try selecting different origin/destination airports or consult our AI Concierge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-8">
      <div className="flex justify-between items-center px-1">
        <span className="ui-caption text-[#6b6759]">
          {flights.length} SCHEDULED FLIGHT{flights.length > 1 ? 'S' : ''} AVAILABLE
        </span>
        <span className="ui-caption text-[#244232] font-semibold">
          ■ ALL OPERATED DIRECT-CARRIER
        </span>
      </div>

      <div className="space-y-4">
        {flights.map((flight) => {
          const duration = calculateDuration(flight.departureTime, flight.arrivalTime);
          const isSoldOut = flight.seatsAvailable <= 0;

          return (
            <div
              key={flight.id}
              className="bg-[#f3ecd6] border border-[rgba(28,26,20,0.12)] hover:border-[rgba(28,26,20,0.3)] transition-all p-6 md:p-8 rounded-[4px]"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Flight Metadata Left */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold tracking-wider text-[#1c1a14]">
                      {flight.flightNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-[#ebe4cf] text-[#6b6759] font-mono rounded-[2px] border border-[rgba(28,26,20,0.08)]">
                      {flight.aircraft?.model || 'Boeing 787-9'}
                    </span>
                  </div>
                  <span className="text-xs text-[#6b6759] font-mono">
                    {formatDate(flight.departureTime)} • NON-STOP
                  </span>
                </div>

                {/* Timeline Center */}
                <div className="flex-1 grid grid-cols-3 items-center text-center max-w-lg w-full">
                  {/* Origin */}
                  <div className="text-left">
                    <div className="font-display text-3xl font-normal text-[#1c1a14]">
                      {formatTime(flight.departureTime)}
                    </div>
                    <div className="font-mono text-base font-semibold text-[#1c1a14]">
                      {flight.origin.code}
                    </div>
                    <div className="text-xs text-[#6b6759] truncate max-w-[120px]">
                      {flight.origin.city}
                    </div>
                  </div>

                  {/* Route Bar */}
                  <div className="flex flex-col items-center px-4">
                    <span className="text-[11px] font-mono text-[#6b6759] mb-1">
                      {duration}
                    </span>
                    <div className="w-full relative flex items-center justify-center">
                      <div className="w-full h-[1px] bg-[rgba(28,26,20,0.2)]" />
                      <div className="w-2 h-2 bg-[#244232] rotate-45 absolute" />
                    </div>
                    <span className="ui-caption text-[10px] text-[#244232] mt-1 font-semibold">
                      DIRECT
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="text-right">
                    <div className="font-display text-3xl font-normal text-[#1c1a14]">
                      {formatTime(flight.arrivalTime)}
                    </div>
                    <div className="font-mono text-base font-semibold text-[#1c1a14]">
                      {flight.destination.code}
                    </div>
                    <div className="text-xs text-[#6b6759] truncate max-w-[120px] ml-auto">
                      {flight.destination.city}
                    </div>
                  </div>
                </div>

                {/* Pricing & Selection Right */}
                <div className="flex sm:flex-row lg:flex-col items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-[rgba(28,26,20,0.12)]">
                  <div className="text-left lg:text-right">
                    <span className="ui-caption text-[#6b6759] block">
                      BASE FARE FROM
                    </span>
                    <div className="font-display text-3xl font-normal text-[#1c1a14]">
                      ${parseFloat(flight.basePrice).toFixed(0)}{' '}
                      <span className="text-xs font-mono text-[#6b6759]">USD</span>
                    </div>
                    <span className="text-[11px] font-mono block text-[#6b6759] mt-0.5">
                      {flight.seatsAvailable} seat{flight.seatsAvailable === 1 ? '' : 's'} available
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectFlight(flight)}
                    disabled={isSoldOut}
                    className="btn-primary !py-3 !px-6 cursor-pointer whitespace-nowrap"
                  >
                    {isSoldOut ? 'SOLD OUT' : 'SELECT SEATS'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
