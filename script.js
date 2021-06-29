import setDragAndDrop from './dragAndDrop';
import addGlobalEventListener from './util/addGlobalEventListener';
import capitalizeText from './util/capitalizeText';
import { v4 as uuidV4 } from 'uuid';
import { saveAs } from 'file-saver';
const downloadBtn = document.querySelector('[data-download-file]');
const uploadBtn = document.querySelector('[data-upload-file]');
const trashWrapper = document.querySelector('[data-trash]');
const formNewLane = document.querySelector('[data-lane-form]');
const lanesEl = document.querySelector('[data-lanes]');
const laneTemplate = document.querySelector('#lane-template');
const STORAGE_PREFIX = 'TRELLO-CLONE';
const LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}-lanes`;
const DEFAULT_LANES = {
  backlog: [{ id: uuidV4(), text: 'Enter your first task' }],
  doing: [],
  done: [],
};

let lanes = loadLanes();

formNewLane.addEventListener('submit', e => {
  e.preventDefault();
  const formEl = e.target;
  const newLane = formEl.querySelector('[ data-lane-input]').value;
  if (newLane === '') return;
  const newLaneEl = createLane(newLane);
  lanesEl.append(newLaneEl);
  formEl.querySelector('[ data-lane-input]').value = '';
});

addGlobalEventListener('click', '[data-remove-lane]', e => {
  const parent = e.target.closest('.lane');
  const laneId = parent.querySelector('[data-zone-id]').dataset.zoneId;
  delete lanes[laneId];
  saveLanes();
  renderLanes();
});

addGlobalEventListener('submit', '[data-task-form]', e => {
  e.preventDefault();
  const formEl = e.target;
  const text = formEl.querySelector('[data-task-input]').value;
  if (text === '') return;

  const lane = formEl.closest('.lane').querySelector('[data-drop-zone]');
  const task = { id: uuidV4(), text: text };
  const taskElement = createTask(task);
  lanes[lane.dataset.zoneId].push(task);
  lane.append(taskElement);

  formEl.querySelector('[data-task-input]').value = '';
  saveLanes();
});

downloadBtn.addEventListener('click', downloadFile);
uploadBtn.addEventListener('change', handleFiles);

setDragAndDrop(onDragMove, onDragComplete);

async function handleFiles(e) {
  const uploadedFile = e.target.files[0];
  if (uploadedFile.type !== 'application/json') {
    displayWarning();
    e.target.value = '';
    return;
  }
  let jsonText = await uploadedFile.text();
  let parsedJson = await JSON.parse(jsonText);
  lanes = parsedJson;
  saveLanes();
  renderLanes();

  e.target.value = '';
}

function displayWarning() {
  console.log('Please upload a json file');
}

function downloadFile() {
  const fileToSave = new Blob([JSON.stringify(lanes, undefined, 2)], {
    type: 'application/json',
  });
  saveAs(fileToSave, 'data.json');
}

function onDragComplete(object) {
  // Remove from the start lane
  const startLaneId = object.startZone.dataset.zoneId;
  const startLane = lanes[startLaneId];
  const task = startLane.find(t => t.id === object.dragItem.id);
  startLane.splice(startLane.indexOf(task), 1);
  // Check if object has endZone, if it does then add the task to it
  if (object.hasOwnProperty('endZone')) {
    const endLaneId = object.endZone.dataset.zoneId;
    const endLane = lanes[endLaneId];
    endLane.splice(object.index, 0, task);
  }
  onDragMove(false);

  saveLanes();
}

function onDragMove(onTrash) {
  if (onTrash) {
    trashWrapper.classList.add('pulse');
  } else {
    trashWrapper.classList.remove('pulse');
  }
}

function loadLanes() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || DEFAULT_LANES;
}

function saveLanes() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lanes));
}

function renderTasks() {
  Object.entries(lanes).forEach(lane => {
    const laneName = lane[0];
    const tasks = lane[1];
    const laneElement = document.querySelector(`[data-zone-id="${laneName}"]`);
    laneElement.innerHTML = '';
    tasks.forEach(t => {
      const task = createTask(t);
      laneElement.append(task);
    });
  });
}

function renderLanes() {
  lanesEl.innerHTML = '';
  Object.keys(lanes).forEach(lane => {
    const newLane = createLane(lane);
    lanesEl.append(newLane);
  });
  renderTasks();
}

function createTask(t) {
  const taskElement = document.createElement('div');
  taskElement.classList.add('task');
  taskElement.dataset.draggable = true;
  taskElement.innerText = t.text;
  taskElement.id = t.id;
  return taskElement;
}

function createLane(newLane) {
  const laneElement = laneTemplate.content.cloneNode(true);
  const capitalizedNewLane = capitalizeText(newLane);
  const header = laneElement.querySelector('[data-header]');
  header.innerText = capitalizedNewLane;
  const icon = document.createElement('i');
  icon.classList.add('fas', 'fa-times');
  icon.dataset.removeLane = true;
  header.append(icon);
  const tasks = laneElement.querySelector('[data-zone-id]');
  tasks.dataset.zoneId = newLane;
  return laneElement;
}

// <i class="fas fa-times"></i>

renderLanes();
