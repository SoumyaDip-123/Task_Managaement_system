# Task_Managaement_system
Task Manager  
A simple, lightweight task management web app built with plain HTML, CSS and JavaScript. No frameworks, no build tools, no dependencies. Just open it in a browser.
Features:

Add tasks with a priority (Low / Medium / High) and an optional due date
Mark tasks as completed or active
Edit a task inline (Enter to save, Esc to cancel)
Delete individual tasks or clear all completed tasks at once
Filter tasks by All, Active or Completed
Overdue tasks are highlighted
Live counter of remaining tasks
Tasks are saved in the browser using localStorage, so they persist after a refresh
Responsive layout that works on desktop and mobile
Tech Stack
Layer	Technology
Structure	HTML5
Styling	CSS3 (Flexbox)
Logic	Vanilla JavaScript (ES6+)
Storage	Browser localStorage
Project Structure
task-manager/
├── index.html   # Page structure
├── style.css    # Styling
├── script.js    # App logic (add, edit, delete, filter, storage)
└── README.md
Getting Started
Clone the repository:
bash
   git clone https://github.com/<your-username>/task-manager.git
Open the folder:
bash
   cd task-manager
Open index.html in your browser (double-click it, or use a tool like VS Code Live Server).
How It Works
Tasks are stored as an array of objects in localStorage:
js
  { id, title, priority, due, completed }
Every action (add, toggle, edit, delete) updates the array, saves it, and re-renders the list.
Possible Improvements
Drag-and-drop reordering
Search and sort options
Categories or tags
Dark mode
Backend and user accounts
License

This project is open source and available under the MIT License.
