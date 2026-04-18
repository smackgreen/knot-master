import React from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

// This wrapper component is used to suppress the defaultProps warning from react-beautiful-dnd
const DroppableWrapper: React.FC<DroppableProps> = (props) => {
  // Simply pass all props to the Droppable component
  return <Droppable {...props} />;
};

export default DroppableWrapper;
