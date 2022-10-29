//------------------------------------------------------------//
//        Copyright (c) MidSpike, All rights reserved.        //
//------------------------------------------------------------//

'use strict';

//------------------------------------------------------------//

document.querySelectorAll('[data-navigation-url]').forEach((element) => {
    element.addEventListener('click', (event) => {
        event.preventDefault();
        window.open(event.target.dataset.navigationUrl, '_self');
    });
});

document.querySelectorAll('[data-navigation-action]').forEach((element) => {
    element.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const action = event.target.getAttribute('data-navigation-action');
        if (!action) return;

        switch (action) {
            case 'toggle_theme': {
                const current_theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
                document.documentElement.setAttribute('data-theme', current_theme === 'dark' ? 'light' : 'dark');

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
        window.open(element.getAttribute('data-project-url'), '_blank');
    });
});
