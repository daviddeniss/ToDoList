import { pluralize } from "./utils.js";

const FEEDBACK_TIMEOUT_MS = 5000;

/**
 * Responsável apenas pelo DOM. Os textos vindos da API são inseridos com
 * textContent (nunca innerHTML), o que impede XSS.
 */
export class TodoView {
  constructor() {
    this.form = document.getElementById("todoForm");
    this.input = document.getElementById("todoInput");
    this.addButton = document.getElementById("addBtn");
    this.searchInput = document.getElementById("searchInput");
    this.sortSelect = document.getElementById("sortSelect");
    this.filterButtons = document.querySelectorAll(".filter-btn");
    this.list = document.getElementById("todoList");
    this.emptyState = document.getElementById("emptyState");
    this.counter = document.getElementById("counter");
    this.feedback = document.getElementById("feedback");
    this.template = document.getElementById("todoItemTemplate");
    this.feedbackTimeoutId = undefined;
  }

  renderTodos(todos) {
    const items = todos.map((todo) => this.#createItem(todo));
    this.list.replaceChildren(...items);
    this.emptyState.hidden = todos.length > 0;

    const pending = todos.filter((todo) => !todo.completed).length;
    this.counter.textContent =
      todos.length === 0
        ? ""
        : `${pluralize(todos.length, "tarefa", "tarefas")} · ${pluralize(pending, "pendente", "pendentes")}`;
  }

  #createItem(todo) {
    const item = this.template.content.firstElementChild.cloneNode(true);
    item.dataset.id = todo.id;
    item.classList.toggle("completed", todo.completed);
    item.querySelector(".todo-toggle").checked = todo.completed;
    item.querySelector(".todo-title").textContent = todo.title;
    item.querySelector(".delete-btn").setAttribute("aria-label", `Excluir tarefa "${todo.title}"`);
    return item;
  }

  setLoading(isLoading) {
    this.list.setAttribute("aria-busy", String(isLoading));
    this.list.classList.toggle("loading", isLoading);
  }

  setSubmitting(isSubmitting) {
    this.addButton.disabled = isSubmitting;
  }

  setActiveFilter(activeButton) {
    this.filterButtons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  resetForm() {
    this.form.reset();
    this.input.focus();
  }

  showError(message) {
    this.feedback.textContent = message;
    this.feedback.hidden = false;
    clearTimeout(this.feedbackTimeoutId);
    this.feedbackTimeoutId = setTimeout(() => {
      this.feedback.hidden = true;
    }, FEEDBACK_TIMEOUT_MS);
  }
}
