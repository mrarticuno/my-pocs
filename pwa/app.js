let todos = [];
const CACHE_NAME = 'todo-pwa-v1';
let swRegistration = null;

async function init() {
  loadTodos();
  await registerServiceWorker();

  if ('Notification' in window) {
    const button = document.querySelector('#notification-permission button');
    if (Notification.permission === 'granted') {
      button.textContent = 'Notifications Enabled';
      button.disabled = true;
    } else if (Notification.permission === 'denied') {
      button.textContent = 'Notifications Blocked';
    }
  }
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register(
        'service-worker.js'
      );
      console.log('Service Worker registered successfully');
      return swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    console.log('Service Worker is not supported in this browser');
    return null;
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);

    const button = document.querySelector('#notification-permission button');
    if (permission === 'granted') {
      button.textContent = 'Notifications Enabled';
      button.disabled = true;
      showNotification(
        'Notifications Enabled',
        'You will now receive notifications!'
      );
    } else if (permission === 'denied') {
      button.textContent = 'Notifications Blocked';
      alert('Please enable notifications in your browser settings');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    alert('There was an error enabling notifications');
  }
}

async function showNotification(title, body) {
  console.log('Attempting to show notification:', { title, body });

  if (Notification.permission !== 'granted') {
    console.log('Notifications not granted');
    return;
  }

  try {
    if (!navigator.serviceWorker.ready) {
      console.log('Service Worker not ready');
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      body,
      icon: 'icon-192x192.png',
      badge: 'icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'todo-notification',
      renotify: true,
    });

    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

function testNotification() {
  showNotification(
    'Test Notification',
    'This is a test notification. If you see this, notifications are working!'
  );
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();

  if (text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    input.value = '';

    console.log('Triggering notification for new todo');
    showNotification('New Todo Added', `Added: ${text}`);
  }
}

function saveTodos() {
  try {
    localStorage.setItem('todos', JSON.stringify(todos));
    console.log('Todos saved successfully');
  } catch (error) {
    console.error('Error saving todos:', error);
  }
}

function loadTodos() {
  try {
    const stored = localStorage.getItem('todos');
    todos = stored ? JSON.parse(stored) : [];
    console.log('Todos loaded successfully');
    renderTodos();
  } catch (error) {
    console.error('Error loading todos:', error);
    todos = [];
  }
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  todos.forEach((todo) => {
    const div = document.createElement('div');
    div.className = 'todo-item';
    div.innerHTML = `
            <span style="text-decoration: ${
              todo.completed ? 'line-through' : 'none'
            }">
                ${todo.text}
            </span>
            <div>
                <button onclick="toggleTodo(${todo.id})" class="toggle-btn">
                    ${todo.completed ? 'Undo' : 'Complete'}
                </button>
                <button onclick="deleteTodo(${
                  todo.id
                })" class="delete-btn">Delete</button>
            </div>
        `;
    list.appendChild(div);
  });
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();

    const message = todo.completed
      ? `Completed: ${todo.text}`
      : `Unmarked: ${todo.text}`;
    showNotification('Todo Updated', message);
  }
}

function deleteTodo(id) {
  const todoToDelete = todos.find((t) => t.id === id);
  if (todoToDelete) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    renderTodos();

    showNotification('Todo Deleted', `Removed: ${todoToDelete.text}`);
  }
}

document
  .getElementById('todo-input')
  .addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });

init().catch((error) => {
  console.error('Error initializing app:', error);
});
