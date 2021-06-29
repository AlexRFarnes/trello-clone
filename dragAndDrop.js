import { off } from 'process';
import addGlobalEventListener from './util/addGlobalEventListener';

export default function setDragAndDrop(onDragMove, onDragComplete) {
  addGlobalEventListener('mousedown', '[data-draggable]', e => {
    const selectedItem = e.target;
    const clonedItem = selectedItem.cloneNode(true);
    const ghost = selectedItem.cloneNode(true);
    const offset = setDragElements(selectedItem, clonedItem, ghost, e);
    setDragEvents(
      selectedItem,
      clonedItem,
      ghost,
      offset,
      onDragMove,
      onDragComplete
    );
  });
}

function setDragElements(selectedItem, clonedItem, ghost, e) {
  const rect = selectedItem.getBoundingClientRect();
  clonedItem.classList.add('dragging');
  clonedItem.style.width = `${rect.width}px`;
  const offset = calculateOffset(rect, e);
  positionItem(clonedItem, e, offset);

  ghost.classList.add('ghost');
  ghost.style.height = `${rect.height}px`;
  ghost.innerHTML = '';

  selectedItem.classList.add('hide');

  selectedItem.parentElement.insertBefore(ghost, selectedItem);
  document.body.append(clonedItem);

  return offset;
}

function setDragEvents(
  selectedItem,
  clonedItem,
  ghost,
  offset,
  onDragMove,
  onDragComplete
) {
  const mousemove = e => {
    positionItem(clonedItem, e, offset);
    const dropZone = getDropZone(e.target);
    if (dropZone == null) return;

    if (dropZone.hasAttribute('data-trash')) {
      ghost.style.display = 'none';
      onDragMove(true);
    } else {
      ghost.style.display = 'block';
      onDragMove(false);
    }

    const child = Array.from(dropZone.children).find(child => {
      const rect = child.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    if (child) {
      dropZone.insertBefore(ghost, child);
    } else {
      dropZone.append(ghost);
    }
  };

  document.addEventListener('mousemove', mousemove);
  document.addEventListener(
    'mouseup',
    e => {
      const dropZone = getDropZone(ghost);
      if (!dropZone.hasAttribute('data-trash')) {
        onDragComplete({
          startZone: getDropZone(selectedItem),
          endZone: dropZone,
          dragItem: selectedItem,
          index: Array.from(dropZone.children).indexOf(ghost),
        });
        dropZone.insertBefore(selectedItem, ghost);
        selectedItem.classList.remove('hide');
      } else {
        onDragComplete({
          startZone: getDropZone(selectedItem),
          dragItem: selectedItem,
        });
        selectedItem.remove();
      }
      clonedItem.remove();
      ghost.remove();
      document.removeEventListener('mousemove', mousemove);
    },
    { once: true }
  );
}

function getDropZone(element) {
  if (element.matches('[data-drop-zone]')) {
    return element;
  } else {
    return element.closest('[data-drop-zone]');
  }
}

function positionItem(clonedItem, mouseposition, offset) {
  clonedItem.style.top = `${mouseposition.clientY - offset.Y}px`;
  clonedItem.style.left = `${mouseposition.clientX - offset.X}px`;
}

function calculateOffset(rect, e) {
  return {
    X: e.clientX - rect.left,
    Y: e.clientY - rect.top,
  };
}
