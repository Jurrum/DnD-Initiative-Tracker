/**
 * ModalManager - Handles custom modal dialogs
 * Replaces browser prompt() with styled, accessible dialogs
 */
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.previousFocus = null;
        this.setupKeyboardHandler();
    }

    /**
     * Set up global keyboard handler for Escape key
     */
    setupKeyboardHandler() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
    }

    /**
     * Show a prompt dialog (replacement for browser prompt)
     * @param {Object} options - { title, message, placeholder, defaultValue, type }
     * @returns {Promise<string|null>} The entered value or null if cancelled
     */
    prompt(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Enter Value',
                message = '',
                placeholder = '',
                defaultValue = '',
                type = 'text',
                min,
                max
            } = options;

            const modal = this.createModal({
                title,
                content: this.createPromptContent(message, placeholder, defaultValue, type, min, max),
                buttons: [
                    { text: 'Cancel', className: 'btn btn-secondary', action: 'cancel' },
                    { text: 'OK', className: 'btn btn-primary', action: 'confirm' }
                ],
                onAction: (action, modal) => {
                    if (action === 'confirm') {
                        const input = modal.querySelector('.modal-input');
                        resolve(input.value);
                    } else {
                        resolve(null);
                    }
                    this.close();
                }
            });

            this.show(modal);

            // Focus the input after modal is shown
            setTimeout(() => {
                const input = modal.querySelector('.modal-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);

            // Allow Enter to submit
            const input = modal.querySelector('.modal-input');
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        resolve(input.value);
                        this.close();
                    }
                });
            }
        });
    }

    /**
     * Show a confirmation dialog (replacement for browser confirm)
     * @param {Object} options - { title, message, confirmText, cancelText }
     * @returns {Promise<boolean>} True if confirmed, false otherwise
     */
    confirm(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                dangerous = false
            } = options;

            const content = DOMHelpers.createElement('p', {
                className: 'modal-message',
                text: message
            });

            const modal = this.createModal({
                title,
                content,
                buttons: [
                    { text: cancelText, className: 'btn btn-secondary', action: 'cancel' },
                    {
                        text: confirmText,
                        className: dangerous ? 'btn btn-danger' : 'btn btn-primary',
                        action: 'confirm'
                    }
                ],
                onAction: (action) => {
                    resolve(action === 'confirm');
                    this.close();
                }
            });

            this.show(modal);
        });
    }

    /**
     * Show an alert dialog (replacement for browser alert)
     * @param {Object} options - { title, message }
     * @returns {Promise<void>}
     */
    alert(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Alert',
                message = '',
                type = 'info' // info, success, warning, error
            } = options;

            const content = DOMHelpers.createElement('p', {
                className: `modal-message modal-message-${type}`,
                text: message
            });

            const modal = this.createModal({
                title,
                content,
                buttons: [
                    { text: 'OK', className: 'btn btn-primary', action: 'ok' }
                ],
                onAction: () => {
                    resolve();
                    this.close();
                }
            });

            this.show(modal);
        });
    }

    /**
     * Show a select dialog (for choosing from options)
     * @param {Object} options - { title, message, options: [{value, text}], defaultValue }
     * @returns {Promise<string|null>}
     */
    select(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Select Option',
                message = '',
                choices = [],
                defaultValue = ''
            } = options;

            const content = DOMHelpers.createElement('div', {
                className: 'modal-select-content',
                children: [
                    message ? DOMHelpers.createElement('p', {
                        className: 'modal-message',
                        text: message
                    }) : null,
                    DOMHelpers.createSelect(
                        choices.map(c => ({
                            value: c.value,
                            text: c.text,
                            selected: c.value === defaultValue
                        })),
                        { className: 'modal-select' }
                    )
                ]
            });

            const modal = this.createModal({
                title,
                content,
                buttons: [
                    { text: 'Cancel', className: 'btn btn-secondary', action: 'cancel' },
                    { text: 'Select', className: 'btn btn-primary', action: 'confirm' }
                ],
                onAction: (action, modal) => {
                    if (action === 'confirm') {
                        const select = modal.querySelector('.modal-select');
                        resolve(select.value);
                    } else {
                        resolve(null);
                    }
                    this.close();
                }
            });

            this.show(modal);
        });
    }

    /**
     * Show custom modal with form content
     * @param {Object} options - Modal options
     * @returns {Promise<Object|null>}
     */
    form(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Form',
                fields = [],
                submitText = 'Submit',
                cancelText = 'Cancel'
            } = options;

            const form = DOMHelpers.createElement('form', {
                className: 'modal-form',
                events: {
                    submit: (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const data = {};
                        for (const [key, value] of formData.entries()) {
                            data[key] = value;
                        }
                        resolve(data);
                        this.close();
                    }
                }
            });

            // Add form fields
            for (const field of fields) {
                const group = this.createFormGroup(field);
                form.appendChild(group);
            }

            const modal = this.createModal({
                title,
                content: form,
                buttons: [
                    { text: cancelText, className: 'btn btn-secondary', action: 'cancel' },
                    { text: submitText, className: 'btn btn-primary', action: 'submit', type: 'submit' }
                ],
                onAction: (action) => {
                    if (action === 'cancel') {
                        resolve(null);
                        this.close();
                    }
                    // Submit action is handled by form submit event
                }
            });

            this.show(modal);
        });
    }

    /**
     * Create a form group element
     * @param {Object} field - Field configuration
     * @returns {HTMLElement}
     */
    createFormGroup(field) {
        const {
            name,
            label,
            type = 'text',
            placeholder = '',
            value = '',
            required = false,
            options = []
        } = field;

        const group = DOMHelpers.createElement('div', { className: 'form-group' });

        if (label) {
            group.appendChild(DOMHelpers.createElement('label', {
                text: label,
                attrs: { for: `modal-field-${name}` }
            }));
        }

        let input;
        if (type === 'select') {
            input = DOMHelpers.createSelect(
                options.map(o => ({ value: o.value, text: o.text, selected: o.value === value })),
                {
                    className: 'form-control',
                    attrs: {
                        name,
                        id: `modal-field-${name}`,
                        ...(required && { required: 'required' })
                    }
                }
            );
        } else if (type === 'textarea') {
            input = DOMHelpers.createElement('textarea', {
                className: 'form-control',
                text: value,
                attrs: {
                    name,
                    id: `modal-field-${name}`,
                    placeholder,
                    ...(required && { required: 'required' })
                }
            });
        } else {
            input = DOMHelpers.createInput(type, {
                className: 'form-control',
                name,
                placeholder,
                value,
                required,
                attrs: { id: `modal-field-${name}` }
            });
        }

        group.appendChild(input);
        return group;
    }

    /**
     * Create prompt content
     */
    createPromptContent(message, placeholder, defaultValue, type, min, max) {
        const content = DOMHelpers.createElement('div', { className: 'modal-prompt-content' });

        if (message) {
            content.appendChild(DOMHelpers.createElement('p', {
                className: 'modal-message',
                text: message
            }));
        }

        const inputAttrs = { placeholder };
        if (min !== undefined) inputAttrs.min = min;
        if (max !== undefined) inputAttrs.max = max;

        const input = DOMHelpers.createInput(type, {
            className: 'form-control modal-input',
            value: defaultValue,
            ...inputAttrs
        });

        content.appendChild(input);
        return content;
    }

    /**
     * Create modal structure
     * @param {Object} options - { title, content, buttons, onAction }
     * @returns {HTMLElement}
     */
    createModal(options) {
        const { title, content, buttons = [], onAction } = options;

        // Overlay
        const overlay = DOMHelpers.createElement('div', {
            className: 'modal-overlay',
            events: {
                click: (e) => {
                    if (e.target === overlay) {
                        if (onAction) onAction('cancel', overlay);
                    }
                }
            }
        });

        // Dialog
        const dialog = DOMHelpers.createElement('div', {
            className: 'modal-dialog',
            attrs: {
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': 'modal-title'
            }
        });

        // Header
        const header = DOMHelpers.createElement('div', {
            className: 'modal-header',
            children: [
                DOMHelpers.createElement('h3', {
                    id: 'modal-title',
                    className: 'modal-title',
                    text: title
                }),
                DOMHelpers.createButton('×', 'modal-close', () => {
                    if (onAction) onAction('cancel', overlay);
                })
            ]
        });

        // Body
        const body = DOMHelpers.createElement('div', {
            className: 'modal-body',
            children: [content]
        });

        // Footer with buttons
        const footer = DOMHelpers.createElement('div', { className: 'modal-footer' });

        for (const btn of buttons) {
            const button = DOMHelpers.createElement('button', {
                className: btn.className,
                text: btn.text,
                attrs: btn.type ? { type: btn.type } : {},
                events: {
                    click: () => {
                        if (onAction) onAction(btn.action, overlay);
                    }
                }
            });
            footer.appendChild(button);
        }

        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);

        return overlay;
    }

    /**
     * Show a modal
     * @param {HTMLElement} modal - Modal element
     */
    show(modal) {
        // Store previous focus
        this.previousFocus = document.activeElement;

        // Add to DOM
        document.body.appendChild(modal);
        this.activeModal = modal;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        // Set up focus trap
        this.setupFocusTrap(modal);
    }

    /**
     * Close the active modal
     */
    close() {
        if (!this.activeModal) return;

        const modal = this.activeModal;
        modal.classList.remove('show');

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 200);

        // Restore focus
        if (this.previousFocus) {
            this.previousFocus.focus();
        }

        this.activeModal = null;
    }

    /**
     * Set up focus trap within modal
     * @param {HTMLElement} modal - Modal element
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
}

// Create singleton instance
const modalManager = new ModalManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalManager, modalManager };
}
