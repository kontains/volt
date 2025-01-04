import Draggable from 'react-draggable';
import React from 'react';
import './Index.css'; 

export default function DraggableComponents() {
  return (
    <div className="draggable-container">
      <h3>GeeksforGeeks - Draggable Components</h3>
      <Draggable>
        <div className="draggable-box">We can move this text</div>
      </Draggable>
      <Draggable>
        <div className="draggable-box">Moe me!</div>
      </Draggable>
    </div>
  );
}
