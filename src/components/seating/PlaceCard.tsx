import React from 'react';
import { Guest, Table } from '@/types';

interface PlaceCardProps {
  guest: Guest;
  table?: Table;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ guest, table }) => {
  return (
    <div className="place-card w-[3.5in] h-[2in] border border-gray-300 rounded-md p-4 m-2 bg-white shadow-sm print:shadow-none print:border-none">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl font-bold mb-1">
          {guest.firstName} {guest.lastName}
          {guest.isCouple && guest.partnerFirstName && (
            <span> & {guest.partnerFirstName} {guest.lastName}</span>
          )}
        </div>
        
        {table && (
          <div className="text-lg mb-2">
            Table: <span className="font-semibold">{table.name}</span>
          </div>
        )}
        
        {guest.hasChildren && guest.children && guest.children.length > 0 && (
          <div className="text-sm text-gray-600 mt-1">
            With: {guest.children.join(', ')}
          </div>
        )}
        
        {guest.dietaryRestrictions && (
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Dietary Needs:</span> {guest.dietaryRestrictions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;
