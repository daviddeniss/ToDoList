class TodoApp {
  constructor() {
    this.API_URL = "http://localhost:3000/api/todos";
    this.todoList = document.getElementById("todoList");
    this.initElements();
    this.initEvents();
    this.loadTodos();
  }

  initElements() {
    this.todoInput = document.getElementById("todoInput");
    this.addBtn = document.getElementById("addBtn");
    this.searchInput = document.getElementById("searchInput");
    this.sortSelect = document.getElementById("sortSelect");
    this.filterButtons = document.querySelectorAll(".filter-btn");
  }

  initEvents() {
    // Adicionar tarefa
    this.addBtn.addEventListener("click", () => this.addTodo());
    this.todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTodo();
    });

    // Filtros e busca
    this.filterButtons.forEach(btn => {
      btn.addEventListener("click", () => this.applyFilter(btn));
    });
    
    this.searchInput.addEventListener("input", () => this.loadTodos());
    this.sortSelect.addEventListener("change", () => this.loadTodos());
  }

  async loadTodos() {
    try {
      const activeFilter = document.querySelector(".filter-btn.active").dataset.filter;
      const params = new URLSearchParams({
        completed: activeFilter === "all" ? "" : activeFilter === "completed",
        search: this.searchInput.value,
        sort: this.sortSelect.value
      });

      const response = await fetch(`${this.API_URL}?${params}`);
      const todos = await response.json();
      this.renderTodos(todos);
    } catch (error) {
      console.error("Error loading todos:", error);
    }
  }

  renderTodos(todos) {
    this.todoList.innerHTML = todos.map(todo => `
      <li class="${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="title">${todo.title}</span>
        <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
      </li>
    `).join("");

    // Adiciona eventos aos elementos renderizados
    document.querySelectorAll("#todoList li input[type='checkbox']").forEach(checkbox => {
      checkbox.addEventListener("change", (e) => this.toggleTodo(e));
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => this.deleteTodo(e));
    });
  }

  async addTodo() {
    const title = this.todoInput.value.trim();
    if (!title) return;

    try {
      await fetch(this.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      this.todoInput.value = "";
      this.loadTodos();
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  }

  async toggleTodo(e) {
    const li = e.target.closest("li");
    const id = li.dataset.id;
    const completed = e.target.checked;

    try {
      await fetch(`${this.API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
      });
      li.classList.toggle("completed", completed);
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  }

  async deleteTodo(e) {
    const li = e.target.closest("li");
    const id = li.dataset.id;

    try {
      await fetch(`${this.API_URL}/${id}`, { method: "DELETE" });
      li.remove();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }

  applyFilter(btn) {
    this.filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    this.loadTodos();
  }
}

// Inicializa a aplicação
document.addEventListener("DOMContentLoaded", () => new TodoApp());