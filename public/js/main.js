import { todoApi } from "./api.js";
import { TodoView } from "./ui.js";
import { debounce } from "./utils.js";

const view = new TodoView();

const state = {
  status: "all",
  search: "",
  sort: "newest",
  todos: [],
};

let listController;

async function loadTodos() {
  // Cancela a busca anterior para que uma resposta antiga não sobrescreva a nova.
  listController?.abort();
  const controller = new AbortController();
  listController = controller;

  view.setLoading(true);
  try {
    state.todos = await todoApi.list(state, controller.signal);
    view.renderTodos(state.todos);
  } catch (error) {
    if (error.name !== "AbortError") view.showError(error.message);
  } finally {
    if (listController === controller) view.setLoading(false);
  }
}

async function addTodo(event) {
  event.preventDefault();
  const title = view.input.value.trim();
  if (!title) {
    view.input.focus();
    return;
  }

  view.setSubmitting(true);
  try {
    await todoApi.create(title);
    view.resetForm();
    await loadTodos();
  } catch (error) {
    view.showError(error.message);
  } finally {
    view.setSubmitting(false);
  }
}

async function toggleTodo(checkbox) {
  const item = checkbox.closest(".todo-item");
  const completed = checkbox.checked;

  // Atualização otimista: a UI muda na hora e volta atrás se a API falhar.
  item.classList.toggle("completed", completed);
  checkbox.disabled = true;
  try {
    const updated = await todoApi.update(item.dataset.id, { completed });
    if (state.status === "all") {
      state.todos = state.todos.map((todo) => (todo.id === updated.id ? updated : todo));
      view.renderTodos(state.todos);
    } else {
      // A tarefa deixou de corresponder ao filtro atual.
      await loadTodos();
    }
  } catch (error) {
    checkbox.checked = !completed;
    item.classList.toggle("completed", !completed);
    view.showError(error.message);
  } finally {
    checkbox.disabled = false;
  }
}

async function deleteTodo(button) {
  const { id } = button.closest(".todo-item").dataset;

  button.disabled = true;
  try {
    await todoApi.remove(id);
    state.todos = state.todos.filter((todo) => todo.id !== id);
    view.renderTodos(state.todos);
  } catch (error) {
    button.disabled = false;
    view.showError(error.message);
  }
}

function bindEvents() {
  view.form.addEventListener("submit", addTodo);

  // Delegação de eventos: um único listener para todos os itens da lista.
  view.list.addEventListener("change", (event) => {
    if (event.target.matches(".todo-toggle")) toggleTodo(event.target);
  });
  view.list.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-btn");
    if (button) deleteTodo(button);
  });

  view.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      view.setActiveFilter(button);
      loadTodos();
    });
  });

  const debouncedLoad = debounce(loadTodos, 300);
  view.searchInput.addEventListener("input", () => {
    state.search = view.searchInput.value.trim();
    debouncedLoad();
  });

  view.sortSelect.addEventListener("change", () => {
    state.sort = view.sortSelect.value;
    loadTodos();
  });
}

bindEvents();
loadTodos();
