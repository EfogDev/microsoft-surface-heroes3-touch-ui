const cp = require('child_process');
const events = cp.exec('sudo stdbuf -i0 -o0 -e0 libinput debug-events', { maxBuffer: 1024 * 1024 * 1024 });

class Heroes3Mapper {
    constructor() {
        this.rightButtonPressed = false;

        this.strategy = {
            KEY_VOLUMEDOWN_PRESSED: () => {
                if (!this.rightButtonPressed) {
                    this.rightButtonPressed = true;

                    this.xdotool('mouseup');
                    this.xdotool('mouseup 3');
                    this.xdotool('mousedown 3');
                }
            },
            KEY_VOLUMEDOWN_RELEASED: () => {
                this.rightButtonPressed = false;

                this.xdotool('mouseup 3');
            },
            KEY_VOLUMEUP_PRESSED: () => {
                this.xdotool('key space');
            },
            KEY_VOLUMEUP_RELEASED: () => {
            },
            KEY_POWER_PRESSED: () => {
                this.xdotool('key g');
            },
            STYLUS_CLICK: (pressure) => {
                if (pressure > 0.7 && !this.rightButtonPressed) {
                    // ToDo
                }
            },
            STYLUS_HW_PRESS: () => {
                this.xdotool('keydown ctrl click 1 keyup ctrl');
            },
            STYLUS_HW_RELEASE: () => {
            },
        };
    }

    xdotool(command) {
        cp.exec(`xdotool ${command}`);
    }

    handleKeyboard(key, state) {
        const fn = this.strategy[`${key}_${state}`.toUpperCase()];

        try {
            fn(state);
        } catch (e) {}
    };

    handleStylus(pressure, isHWButton, pressed) {
        try {
            if (isHWButton) {
                return this.strategy[`STYLUS_HW_${pressed ? 'PRESS' : 'RELEASE'}`](pressure);
            }
        } catch (e) {}
    }
}

const mapper = new Heroes3Mapper();

events.stdout.on('data', (data) => {
    try {
        const [ event, eventData, additional, modifiers ] = data.split('\t').filter(Boolean);
        const [ id, name, time ] = event.trim().split(' ').filter(Boolean);
        
        switch (name) {
            case 'KEYBOARD_KEY':
                const [ key,, state ] = eventData.trim().split(' ').filter(Boolean);
                mapper.handleKeyboard(key, state);

                break;
            case 'TABLET_TOOL_AXIS':
                // const [ , pressureString ] = /pressure: (.+)?\*/.exec(modifiers) || [];

                // if (!pressureString)
                //     return;

                // mapper.handleStylus(parseFloat(pressureString), true);    

                break;
            case 'TABLET_TOOL_TIP':
                // mapper.handleStylus(null, false);

                break;
            case 'TABLET_TOOL_BUTTON':
                if (data.includes('pressed')) {
                    mapper.handleStylus(null, true, true);
                } else if (data.includes('released')) {
                    mapper.handleStylus(null, true, false);
                }

                break;
            default:
                break;
        }
    } catch (e) {}
});
