const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const prioritySelect = document.getElementById("priority-select");
const dueInput = document.getElementById("due-input");
const list = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const counter = document.getElementById("counter");
const clearBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask(title, priority, due) {
  tasks.unshift({
    id: Date.now(),
    title: title.trim(),
    priority,
    due,
    completed: false,
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function editTask(id, newTitle) {
  const task = tasks.find((t) => t.id === id);
  if (task && newTitle.trim()) task.title = newTitle.trim();
  saveTasks();
  render();
}

function isOverdue(task) {
  if (!task.due || task.completed) return false;
  const today = new Date().toISOString().split("T")[0];
  return task.due < today;
}

function render() {
  list.innerHTML = "";

  const visible = tasks.filter((t) => {
    if (currentFilter === "active") return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task ${task.priority}${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const body = document.createElement("div");
    body.className = "task-body";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta" + (isOverdue(task) ? " overdue" : "");
    meta.textContent =
      `${task.priority} priority` +
      (task.due ? ` · due ${task.due}${isOverdue(task) ? " (overdue)" : ""}` : "");

    body.append(title, meta);

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.title = "Edit";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => startEditing(task, body, title));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.title = "Delete";
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, body, editBtn, delBtn);
    list.appendChild(li);
  });

  const remaining = tasks.filter((t) => !t.completed).length;
  counter.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
  emptyState.style.display = visible.length ? "none" : "block";
  clearBtn.style.display = tasks.some((t) => t.completed) ? "inline" : "none";
}

function startEditing(task, body, titleEl) {
  const editor = document.createElement("input");
  editor.type = "text";
  editor.className = "edit-input";
  editor.value = task.title;
  body.replaceChild(editor, titleEl);
  editor.focus();

  const finish = () => editTask(task.id, editor.value);
  editor.addEventListener("blur", finish);
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") editor.blur();
    if (e.key === "Escape") render();
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  addTask(input.value, prioritySelect.value, dueInput.value);
  form.reset();
  prioritySelect.value = "medium";
  input.focus();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
});

render();
