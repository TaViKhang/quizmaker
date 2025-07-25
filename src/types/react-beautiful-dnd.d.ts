declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  export type DroppableId = string;
  export type DraggableId = string;
  
  export interface DraggableLocation {
    droppableId: DroppableId;
    index: number;
  }
  
  export interface DragStart {
    draggableId: DraggableId;
    type: string;
    source: DraggableLocation;
  }
  
  export interface DropResult {
    draggableId: DraggableId;
    type: string;
    source: DraggableLocation;
    destination?: DraggableLocation;
  }
  
  export interface DragUpdate extends DropResult {
    destination: DraggableLocation | null;
  }
  
  export interface DroppableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    droppableProps: {
      [key: string]: any;
    };
    placeholder?: React.ReactElement;
  }
  
  export interface DraggableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps?: {
      [key: string]: any;
    };
  }
  
  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver?: DroppableId;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    };
  }
  
  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: DraggableId;
    draggingFromThisWith?: DraggableId;
  }
  
  export interface DroppableProps {
    droppableId: DroppableId;
    type?: string;
    direction?: 'horizontal' | 'vertical';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    ignoreContainerClipping?: boolean;
    renderClone?: any;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
  }
  
  export interface DraggableProps {
    draggableId: DraggableId;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement;
  }
  
  export interface OnDragStartProps {
    draggableId: DraggableId;
    type: string;
    source: DraggableLocation;
  }
  
  export interface OnDragUpdateProps {
    draggableId: DraggableId;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
  }
  
  export interface OnDragEndProps {
    draggableId: DraggableId;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    reason: 'DROP' | 'CANCEL';
  }
  
  export interface DragDropContextProps {
    onDragStart?: (start: DragStart) => void;
    onDragUpdate?: (update: DragUpdate) => void;
    onDragEnd: (result: DropResult) => void;
    children: React.ReactNode;
  }
  
  export class DragDropContext extends React.Component<DragDropContextProps> {}
  export class Droppable extends React.Component<DroppableProps> {}
  export class Draggable extends React.Component<DraggableProps> {}
} 