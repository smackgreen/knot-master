import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SeatingChartManager from '@/components/seating/SeatingChartManager';

const SeatingChart: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">No client ID provided</p>
      </div>
    );
  }

  return <SeatingChartManager clientId={id} />;
};

export default SeatingChart;
