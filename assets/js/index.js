//------------------------------------------------------------//
//        Copyright (c) MidSpike, All rights reserved.        //
//------------------------------------------------------------//

'use strict';

//------------------------------------------------------------//

import { startWireframes } from './wireframes/index.js';

//------------------------------------------------------------//

const default_theme = 'dark';

const user_theme_preference_key = 'user-theme-preference';

//------------------------------------------------------------//

async function registerEventHandlers() {
    document.querySelectorAll('[data-navigation-url]').forEach((element) => {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
    
            window.open(element.dataset.navigationUrl, '_self');
        });
    });
    
    document.querySelectorAll('[data-navigation-action]').forEach((element) => {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
    
            const action = element.getAttribute('data-navigation-action');
            if (!action) return;
    
            switch (action) {
                case 'toggle_visibility': {
                    const main = document.querySelector('#main');
                    if (!main) return;
    
                    const isVisible = main.getAttribute('data-visibility-mode');
                    main.setAttribute('data-visibility-mode', isVisible === 'visible' ? 'hidden' : 'visible');
    
                    break;
                }
    
                case 'toggle_theme': {
                    const user_theme_preference = localStorage.getItem(user_theme_preference_key);
    
                    const current_theme = user_theme_preference ?? default_theme;
                    const new_theme = current_theme === 'dark' ? 'light' : 'dark';
                    document.body.setAttribute('data-theme', new_theme);
    
                    localStorage.setItem(user_theme_preference_key, new_theme);
    
                    break;
                }
    
                default: {
                    break;
                }
            }
        });
    });
    
    document.querySelectorAll('[data-project-url]').forEach((element) => {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();

            window.open(element.getAttribute('data-project-url'), '_blank');
        });
    });
}

async function main() {
    const user_theme_preference = localStorage.getItem(user_theme_preference_key);
    if (user_theme_preference) document.body.setAttribute('data-theme', user_theme_preference);

    registerEventHandlers();

    const mainBox = document.querySelector('#main');
    if (!mainBox) throw new Error('Unable to locate #main');

    startWireframes(mainBox);
}

//------------------------------------------------------------//

window.addEventListener('DOMContentLoaded', () => main());
