/**
 * DOMHelpers - Safe DOM manipulation utilities
 * Prevents XSS by using safe element creation methods
 */
const DOMHelpers = {
    /**
     * Create an element with attributes and children
     * @param {string} tag - Element tag name
     * @param {Object} options - Options: { className, id, attrs, text, html, children, events }
     * @returns {HTMLElement} The created element
     */
    createElement(tag, options = {}) {
        const el = document.createElement(tag);

        if (options.className) {
            el.className = options.className;
        }

        if (options.id) {
            el.id = options.id;
        }

        // Set attributes safely
        if (options.attrs) {
            for (const [key, value] of Object.entries(options.attrs)) {
                el.setAttribute(key, value);
            }
        }

        // Set data attributes
        if (options.data) {
            for (const [key, value] of Object.entries(options.data)) {
                el.dataset[key] = value;
            }
        }

        // Set text content (safe - no XSS)
        if (options.text) {
            el.textContent = options.text;
        }

        // Set styles
        if (options.style) {
            Object.assign(el.style, options.style);
        }

        // Add event listeners
        if (options.events) {
            for (const [event, handler] of Object.entries(options.events)) {
                el.addEventListener(event, handler);
            }
        }

        // Append children
        if (options.children) {
            for (const child of options.children) {
                if (child) {
                    el.appendChild(child);
                }
            }
        }

        return el;
    },

    /**
     * Create a text node
     * @param {string} text - Text content
     * @returns {Text} Text node
     */
    text(text) {
        return document.createTextNode(text);
    },

    /**
     * Safely set text content
     * @param {HTMLElement} el - Element
     * @param {string} text - Text to set
     */
    setText(el, text) {
        el.textContent = text;
    },

    /**
     * Clear all children from an element
     * @param {HTMLElement} el - Element to clear
     */
    clearChildren(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },

    /**
     * Remove all event listeners by replacing element
     * @param {HTMLElement} el - Element
     * @returns {HTMLElement} Clone without event listeners
     */
    removeAllEventListeners(el) {
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        return clone;
    },

    /**
     * Create a button element
     * @param {string} text - Button text
     * @param {string} className - CSS classes
     * @param {Function} onClick - Click handler
     * @param {Object} data - Data attributes
     * @returns {HTMLButtonElement}
     */
    createButton(text, className, onClick, data = {}) {
        return this.createElement('button', {
            className,
            text,
            data,
            events: { click: onClick }
        });
    },

    /**
     * Create an input element
     * @param {string} type - Input type
     * @param {Object} options - Options
     * @returns {HTMLInputElement}
     */
    createInput(type, options = {}) {
        const input = this.createElement('input', {
            className: options.className,
            attrs: {
                type,
                ...(options.placeholder && { placeholder: options.placeholder }),
                ...(options.value !== undefined && { value: options.value }),
                ...(options.min !== undefined && { min: options.min }),
                ...(options.max !== undefined && { max: options.max }),
                ...(options.required && { required: 'required' }),
                ...(options.name && { name: options.name })
            },
            events: options.events
        });

        if (options.value !== undefined) {
            input.value = options.value;
        }

        return input;
    },

    /**
     * Create a select element
     * @param {Array} options - Array of { value, text, selected }
     * @param {Object} config - Configuration
     * @returns {HTMLSelectElement}
     */
    createSelect(options, config = {}) {
        const select = this.createElement('select', {
            className: config.className,
            attrs: config.attrs,
            events: config.events
        });

        for (const opt of options) {
            const option = this.createElement('option', {
                text: opt.text,
                attrs: { value: opt.value }
            });
            if (opt.selected) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        return select;
    },

    /**
     * Create a list item for character/player display
     * @param {Object} data - Character/player data
     * @param {Object} handlers - Event handlers
     * @returns {HTMLElement}
     */
    createCharacterListItem(data, handlers = {}) {
        const item = this.createElement('div', {
            className: `initiative-item ${data.type || 'player'}`,
            data: { id: data.id }
        });

        // Header with name and type
        const header = this.createElement('div', {
            className: 'participant-header',
            children: [
                this.createElement('span', {
                    className: 'participant-type-icon',
                    text: data.typeIcon || '👤'
                }),
                this.createElement('span', {
                    className: 'participant-name',
                    text: data.name || 'Unknown'
                })
            ]
        });

        // Stats section
        const stats = this.createElement('div', {
            className: 'participant-stats',
            children: [
                this.createStatItem('HP', `${data.currentHp}/${data.maxHp}`),
                this.createStatItem('AC', data.ac),
                this.createStatItem('Init', data.initiative || '—')
            ]
        });

        // HP Bar
        const hpBar = this.createHPBar(data.currentHp, data.maxHp);

        item.appendChild(header);
        item.appendChild(stats);
        item.appendChild(hpBar);

        // Add action buttons if handlers provided
        if (Object.keys(handlers).length > 0) {
            const actions = this.createActionButtons(data.id, handlers);
            item.appendChild(actions);
        }

        return item;
    },

    /**
     * Create a stat display item
     * @param {string} label - Stat label
     * @param {string|number} value - Stat value
     * @returns {HTMLElement}
     */
    createStatItem(label, value) {
        return this.createElement('div', {
            className: 'stat-item',
            children: [
                this.createElement('span', { className: 'stat-label', text: label }),
                this.createElement('span', { className: 'stat-value', text: String(value) })
            ]
        });
    },

    /**
     * Create an HP bar
     * @param {number} current - Current HP
     * @param {number} max - Max HP
     * @returns {HTMLElement}
     */
    createHPBar(current, max) {
        const percentage = max > 0 ? (current / max) * 100 : 0;
        let colorClass = 'healthy';
        if (percentage <= 0) colorClass = 'dead';
        else if (percentage <= 25) colorClass = 'critical';
        else if (percentage <= 50) colorClass = 'wounded';
        else if (percentage <= 75) colorClass = 'injured';

        return this.createElement('div', {
            className: 'hp-bar-container',
            children: [
                this.createElement('div', {
                    className: `hp-bar ${colorClass}`,
                    style: { width: `${Math.max(0, Math.min(100, percentage))}%` }
                })
            ]
        });
    },

    /**
     * Create action buttons for a character
     * @param {string} id - Character ID
     * @param {Object} handlers - Event handlers { damage, heal, condition, remove }
     * @returns {HTMLElement}
     */
    createActionButtons(id, handlers) {
        const buttons = this.createElement('div', {
            className: 'participant-quick-actions'
        });

        if (handlers.damage) {
            buttons.appendChild(this.createButton('Damage', 'btn btn-sm btn-danger',
                () => handlers.damage(id), { action: 'damage', id }));
        }

        if (handlers.heal) {
            buttons.appendChild(this.createButton('Heal', 'btn btn-sm btn-success',
                () => handlers.heal(id), { action: 'heal', id }));
        }

        if (handlers.condition) {
            buttons.appendChild(this.createButton('Condition', 'btn btn-sm btn-warning',
                () => handlers.condition(id), { action: 'condition', id }));
        }

        if (handlers.remove) {
            buttons.appendChild(this.createButton('Remove', 'btn btn-sm btn-secondary',
                () => handlers.remove(id), { action: 'remove', id }));
        }

        return buttons;
    },

    /**
     * Create a condition badge
     * @param {Object} condition - Condition object
     * @param {Function} onRemove - Remove handler
     * @returns {HTMLElement}
     */
    createConditionBadge(condition, onRemove) {
        const badge = this.createElement('span', {
            className: 'condition-badge',
            children: [
                this.createElement('span', {
                    className: 'condition-name',
                    text: condition.name
                }),
                condition.duration !== -1 ? this.createElement('span', {
                    className: 'condition-duration',
                    text: ` (${condition.duration})`
                }) : null,
                this.createButton('×', 'condition-remove', () => onRemove(condition))
            ]
        });

        return badge;
    },

    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (default 3000)
     */
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container') ||
            this.createNotificationContainer();

        const notification = this.createElement('div', {
            className: `notification notification-${type}`,
            children: [
                this.createElement('span', { text: message }),
                this.createButton('×', 'notification-close', (e) => {
                    e.target.closest('.notification').remove();
                })
            ]
        });

        container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    },

    /**
     * Create notification container if it doesn't exist
     * @returns {HTMLElement}
     */
    createNotificationContainer() {
        const container = this.createElement('div', {
            id: 'notification-container',
            className: 'notification-container'
        });
        document.body.appendChild(container);
        return container;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMHelpers;
}
