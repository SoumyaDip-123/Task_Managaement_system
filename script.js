/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const ICONS = {
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
};

const CATEGORY_LABELS = { work: "💼 Work", personal: "🏠 Personal", study: "📚 Study", other: "✨ Other" };
const PRIORITY_LABELS = { high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- State ---------- */
const state = {
  tasks: loadTasks(),
  status: "all",
  category: "all",
  search: "",
  sort: "manual",
};

function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem("tasks")) || [];
    // Upgrade tasks saved by the older version
    return data.map((t) => ({ category: "other", priority: "medium", ...t }));
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem("tasks", JSON.stringify(state.tasks));
}

function isOverdue(t) {
  return !!t.due && !t.completed && t.due < todayStr();
}

/* ---------- Actions ---------- */
function addTask(title, category, priority, due) {
  state.tasks.unshift({
    id: Date.now(),
    title: title.trim(),
    category,
    priority,
    due,
    completed: false,
  });
  save();
  render();
}

function toggleTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (t) t.completed = !t.completed;
  save();
  render();
}

function deleteTask(id) {
  const index = state.tasks.findIndex((x) => x.id === id);
  if (index === -1) return;
  const [removed] = state.tasks.splice(index, 1);
  save();
  render();
  showToast("Task deleted", () => {
    state.tasks.splice(index, 0, removed);
    save();
    render();
  });
}

function editTask(id, title) {
  const t = state.tasks.find((x) => x.id === id);
  if (t && title.trim()) t.title = title.trim();
  save();
  render();
}

function moveTask(dragId, targetId) {
  if (dragId === targetId) return;
  const from = state.tasks.findIndex((t) => t.id === dragId);
  const [item] = state.tasks.splice(from, 1);
  const to = state.tasks.findIndex((t) => t.id === targetId);
  state.tasks.splice(to, 0, item);
  save();
  render();
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(message, undoFn) {
  const toast = $("#toast");
  toast.innerHTML = "";
  const span = document.createElement("span");
  span.textContent = message;
  toast.appendChild(span);

  if (undoFn) {
    const btn = document.createElement("button");
    btn.textContent = "Undo";
    btn.addEventListener("click", () => {
      undoFn();
      toast.classList.remove("show");
    });
    toast.appendChild(btn);
  }

  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 5000);
}

/* ---------- Rendering ---------- */
function getVisibleTasks() {
  let items = state.tasks.filter((t) => {
    if (state.category !== "all" && t.category !== state.category) return false;
    if (state.search && !t.title.toLowerCase().includes(state.search)) return false;
    if (state.status === "active") return !t.completed;
    if (state.status === "completed") return t.completed;
    if (state.status === "overdue") return isOverdue(t);
    return true;
  });

  if (state.sort === "newest") {
    items = [...items].sort((a, b) => b.id - a.id);
  } else if (state.sort === "due") {
    items = [...items].sort((a, b) => (a.due || "9999-99-99").localeCompare(b.due || "9999-99-99"));
  } else if (state.sort === "priority") {
    items = [...items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }
  return items;
}

function makeChip(text, className) {
  const chip = document.createElement("span");
  chip.className = `chip ${className}`;
  chip.textContent = text;
  return chip;
}

function buildTask(task) {
  const li = document.createElement("li");
  li.className = `task p-${task.priority}${task.completed ? " done" : ""}`;
  li.dataset.id = task.id;

  const canDrag = state.sort === "manual";
  li.draggable = canDrag;

  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = canDrag ? "⋮⋮" : "";
  handle.style.display = canDrag ? "" : "none";

  const check = document.createElement("button");
  check.className = "check";
  check.setAttribute("aria-label", "Toggle complete");
  check.innerHTML = ICONS.check;
  check.addEventListener("click", () => toggleTask(task.id));

  const body = document.createElement("div");
  body.className = "task-body";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.appendChild(makeChip(CATEGORY_LABELS[task.category] || CATEGORY_LABELS.other, `cat-${task.category}`));
  meta.appendChild(makeChip(PRIORITY_LABELS[task.priority], `pri-${task.priority}`));

  if (task.due) {
    let label = "📅 " + formatDate(task.due);
    let cls = "";
    if (isOverdue(task)) { label = "⚠️ Overdue · " + formatDate(task.due); cls = "overdue"; }
    else if (task.due === todayStr()) { label = "📅 Today"; cls = "today"; }
    else if (task.due === tomorrowStr()) { label = "📅 Tomorrow"; }
    meta.appendChild(makeChip(label, cls));
  }

  body.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.title = "Edit";
  editBtn.innerHTML = ICONS.edit;
  editBtn.addEventListener("click", () => startEditing(task, body, title));

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn del";
  delBtn.title = "Delete";
  delBtn.innerHTML = ICONS.trash;
  delBtn.addEventListener("click", () => deleteTask(task.id));

  actions.append(editBtn, delBtn);
  li.append(handle, check, body, actions);

  // Drag & drop
  if (canDrag) {
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(task.id));
      e.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const dragId = Number(e.dataTransfer.getData("text/plain"));
      moveTask(dragId, task.id);
    });
  }

  return li;
}

function startEditing(task, body, titleEl) {
  const editor = document.createElement("input");
  editor.type = "text";
  editor.className = "edit-input";
  editor.value = task.title;
  body.replaceChild(editor, titleEl);
  editor.focus();
  editor.select();

  let cancelled = false;
  editor.addEventListener("blur", () => {
    if (!cancelled) editTask(task.id, editor.value);
  });
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") editor.blur();
    if (e.key === "Escape") {
      cancelled = true;
      render();
    }
  });
}

function updateStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.completed).length;
  const active = total - done;
  const overdue = state.tasks.filter(isOverdue).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  $("#stat-total").textContent = total;
  $("#stat-done").textContent = done;
  $("#stat-active").textContent = active;
  $("#stat-overdue").textContent = overdue;
  $("#progress-text").textContent = percent + "%";
  $("#progress-bar").style.width = percent + "%";

  $("#count-all").textContent = total;
  $("#count-active").textContent = active;
  $("#count-completed").textContent = done;
  $("#count-overdue").textContent = overdue;

  ["work", "personal", "study", "other"].forEach((c) => {
    $("#cat-" + c).textContent = state.tasks.filter((t) => t.category === c).length;
  });
}

function render() {
  const list = $("#task-list");
  list.innerHTML = "";

  const items = getVisibleTasks();
  items.forEach((t) => list.appendChild(buildTask(t)));

  $("#empty-state").style.display = items.length ? "none" : "block";
  $("#clear-completed").style.display = state.tasks.some((t) => t.completed) ? "" : "none";
  updateStats();
}

/* ---------- Greeting ---------- */
function setGreeting() {
  const h = new Date().getHours();
  const word = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  $("#greeting").textContent = `${word} 👋`;
  $("#today-date").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("#theme-icon").textContent = theme === "dark" ? "☀️" : "🌙";
  $("#theme-label").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

/* ---------- Events ---------- */
$("#task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#task-input");
  if (!input.value.trim()) return;
  addTask(input.value, $("#category-select").value, $("#priority-select").value, $("#due-input").value);
  input.value = "";
  $("#due-input").value = "";
  input.focus();
});

$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.status = btn.dataset.status;
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

$$(".cat-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.category = btn.dataset.cat;
    $$(".cat-item").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

$("#search").addEventListener("input", (e) => {
  state.search = e.target.value.trim().toLowerCase();
  render();
});

$("#sort-select").addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

$("#clear-completed").addEventListener("click", () => {
  const removed = state.tasks.filter((t) => t.completed);
  state.tasks = state.tasks.filter((t) => !t.completed);
  save();
  render();
  showToast(`${removed.length} completed task${removed.length === 1 ? "" : "s"} cleared`, () => {
    state.tasks = [...state.tasks, ...removed];
    save();
    render();
  });
});

$("#theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ---------- Init ---------- */
initTheme();
setGreeting();
render();
