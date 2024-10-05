document.addEventListener('DOMContentLoaded', () => {
  const widgetPanel = document.getElementById('widget-panel');
  const formGrid = document.getElementById('form-grid');
  const propertiesPanel = document.getElementById('properties-panel');
  const widgetProperties = document.getElementById('widget-properties');
  const saveButton = document.getElementById('save-button');
  const loadButton = document.getElementById('load-button');
  const undoButton = document.getElementById('undo-button');
  const redoButton = document.getElementById('redo-button');
  const formNameInput = document.getElementById('form-name');
  const saveFormButton = document.getElementById('save-form-button');
  const formList = document.getElementById('form-list');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  let activeWidget = null;
  let formHistory = [];
  let currentHistoryIndex = -1;

  // Widget definitions
  const widgetTypes = {
    text: { type: 'text', label: 'Text Field', placeholder: 'Enter text here...', required: false },
    checkbox: { type: 'checkbox', label: 'Checkbox', checked: false },
    radio: { type: 'radio', label: 'Radio Button', options: ['Option 1', 'Option 2'] },
    dropdown: { type: 'dropdown', label: 'Dropdown', options: ['Option 1', 'Option 2', 'Option 3'] }
  };

  // 1. Add drag-and-drop functionality for widget panel
  const makeDraggable = (element) => {
    element.setAttribute('draggable', true);
    element.addEventListener('dragstart', (event) => {
      activeWidget = widgetTypes[element.dataset.type];
      element.style.opacity = '0.5';
    });
    element.addEventListener('dragend', () => {
      element.style.opacity = '1';
    });
  };

  document.querySelectorAll('.form-widget').forEach(makeDraggable);

  // 2. Allow widgets to be dropped on the form grid
  formGrid.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  formGrid.addEventListener('drop', (event) => {
    event.preventDefault();
    if (activeWidget) {
      const widgetElement = createWidgetElement(activeWidget);
      formGrid.appendChild(widgetElement);
      activeWidget = null;
      saveFormState();  // Save state after each drop
    }
  });

  // 3. Function to create widget element and handle interactions
  const createWidgetElement = (widget) => {
    const element = document.createElement('div');
    element.classList.add('form-element');
    element.dataset.type = widget.type;
    element.innerHTML = `
      <label>${widget.label}</label>
      ${widget.type === 'text' ? `<input type="text" placeholder="${widget.placeholder}">` : ''}
      ${widget.type === 'checkbox' ? `<input type="checkbox">` : ''}
      ${widget.type === 'radio' ? widget.options.map((option, index) => `<label><input type="radio" name="radio-${index}">${option}</label>`).join('') : ''}
      ${widget.type === 'dropdown' ? `<select>${widget.options.map(option => `<option>${option}</option>`).join('')}</select>` : ''}
      <span class="remove">✖</span>
      <span class="clone">🔄</span>
    `;

    const removeBtn = element.querySelector('.remove');
    const cloneBtn = element.querySelector('.clone');

    removeBtn.addEventListener('click', () => {
      element.remove();
      saveFormState();  // Save state after removing an element
    });

    cloneBtn.addEventListener('click', () => {
      const clone = element.cloneNode(true);
      formGrid.appendChild(clone);
      saveFormState();  // Save state after cloning an element
    });

    element.addEventListener('click', () => {
      updatePropertiesPanel(widget);
    });

    return element;
  };

  // 4. Update properties panel when a widget is selected
  const updatePropertiesPanel = (widget) => {
    widgetProperties.innerHTML = '';
    Object.keys(widget).forEach(key => {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = key;
      input.value = widget[key];
      input.addEventListener('input', (event) => {
        widget[key] = event.target.value;
        saveFormState();  // Save state after updating a widget
      });
      widgetProperties.appendChild(input);
    });
  };

  // 5. Save form state for undo/redo functionality
  const saveFormState = () => {
    const formState = Array.from(document.querySelectorAll('.form-element')).map(el => ({
      type: el.dataset.type,
      label: el.querySelector('label').innerText
    }));

    formHistory = formHistory.slice(0, currentHistoryIndex + 1);  // Remove redo history
    formHistory.push(formState);
    currentHistoryIndex++;
  };

  // 6. Undo functionality
  undoButton.addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
      currentHistoryIndex--;
      loadFormState(formHistory[currentHistoryIndex]);
    }
  });

  // 7. Redo functionality
  redoButton.addEventListener('click', () => {
    if (currentHistoryIndex < formHistory.length - 1) {
      currentHistoryIndex++;
      loadFormState(formHistory[currentHistoryIndex]);
    }
  });

  // 8. Load form state from saved history
  const loadFormState = (state) => {
    formGrid.innerHTML = '';
    state.forEach(widget => {
      const widgetElement = createWidgetElement(widget);
      formGrid.appendChild(widgetElement);
    });
  };

  // 9. Save and load forms to/from localStorage
  saveFormButton.addEventListener('click', () => {
    const formName = formNameInput.value;
    if (!formName) {
      alert('Please provide a form name.');
      return;
    }

    const formData = Array.from(document.querySelectorAll('.form-element')).map(element => ({
      type: element.dataset.type,
      label: element.querySelector('label').innerText
    }));

    const savedForms = JSON.parse(localStorage.getItem('savedForms')) || {};
    savedForms[formName] = formData;
    localStorage.setItem('savedForms', JSON.stringify(savedForms));
    updateFormList();
    alert('Form saved!');
  });

  const updateFormList = () => {
    const savedForms = JSON.parse(localStorage.getItem('savedForms')) || {};
    formList.innerHTML = '';
    Object.keys(savedForms).forEach(formName => {
      const option = document.createElement('option');
      option.value = formName;
      option.textContent = formName;
      formList.appendChild(option);
    });
  };

  loadButton.addEventListener('click', () => {
    const formName = formList.value;
    const savedForms = JSON.parse(localStorage.getItem('savedForms')) || {};
    if (savedForms[formName]) {
      loadFormState(savedForms[formName]);
    } else {
      alert('Form not found.');
    }
  });

  // 10. Dark mode toggle
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // Initial setup
  updateFormList();
});
