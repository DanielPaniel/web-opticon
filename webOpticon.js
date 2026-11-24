class WebOpticon extends HTMLElement {
    static get observedAttributes() {
        return ['eyes', 'isglobal'];
    }

    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        const template = document.createElement('template');
        template.innerHTML = this._getShadowDomHtml();
        this._shadow.appendChild(template.content.cloneNode(true));
        
        this._container = this.parentElement;
        this._onPointerMove = this._onPointerMove.bind(this);
        this._timeout;
    }

    connectedCallback() {
        this._upgradeProperty('eyes');
        let containerBounding = this._container.getBoundingClientRect();  
        this._resetEyes(containerBounding);
        this._container.addEventListener('pointermove', this._onPointerMove);
        this._setRandomAppearances();
    }

    _setRandomAppearances() {
        this._setAppearance(this, "--wo-eye-layout-curve-top", this._randomInt(50, 99) + "%");
        this._setAppearance(this, "--wo-eye-layout-curve-bottom", this._randomInt(50, 99) + "%");
        this._setAppearance(this, "--wo-eye-layout-curve-inner", this._randomInt(10, 35) + "%");
        this._setAppearance(this, "--wo-eye-layout-curve-outer", this._randomInt(0, 25) + "%");
        this._setAppearance(this, "--wo-eye-layout-angle", this._randomInt(-15, 15) + "deg");
        this._setAppearance(this, "--wo-eye-layout-lids", (this._randomInt(2, 15)/100) + "em");
        this._setAppearance(this, "--wo-eye-layout-size-iris", (this._randomInt(10, 20)/100) + "em");
        this._setAppearance(this, "--wo-eye-layout-size-pupil", (this._randomInt(10, 20)/100) + "em");
    }

    _setAppearance(element, property, value) {
        let existingValue = getComputedStyle(element).getPropertyValue(property);
        if (!existingValue) {
            element.style.setProperty(property, value);
        }
    }

    _resetContainerBounding(newBounding) {
        if (newBounding instanceof Element) {
            this._container.removeEventListener('pointermove', this._onPointerMove);
            this._container = newBounding;
            let containerBounding = this._container.getBoundingClientRect();  
            this._resetEyes(containerBounding);
            this._container.addEventListener('pointermove', this._onPointerMove);
        }
    }

    disconnectedCallback() {
        this._container.removeEventListener('pointermove', this._onPointerMove);
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "eyes") {
            const hasNewValue = newValue !== null;
            let hasEyes = this._shadow.querySelectorAll(".eye");
            let eyeCount = hasEyes ? hasEyes.length : 0;
            if (hasNewValue) {
                let diff = newValue - eyeCount;
                if (diff > 0) {
                    for (let i = 0; i < diff; i ++) {
                        this._addEye();
                    }
                }
                if (diff < 0) {
                    for (let i = 0; i > diff; i --) {
                        this._removeEye();
                    }
                }
            }
        }
        if (name === "isglobal") {
            if (newValue !== null) {
                let container = document.querySelector("body");
                this._resetContainerBounding(container);
            } else {
                this._resetContainerBounding(this.parentElement);
            }            
        }
    }

    _prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    _onPointerMove(event) {
        let containerBounding = this._container.getBoundingClientRect();
        this._setEyePosition(containerBounding, event.clientX, event.clientY);
    }

    _setEyePosition(containerBounding, clientX, clientY, moveSpeed = 50) {
        if (!this._prefersReducedMotion()) {
            let eyes = this._shadow.querySelectorAll(".eye");
            eyes.forEach((eye) => {
                let eyeBounding = eye.getBoundingClientRect();
                let position = this._calculatePosition(containerBounding, eyeBounding, clientX, clientY);
                eye.style.setProperty("--wo-eye-posX", position[0]);
                eye.style.setProperty("--wo-eye-posY", position[1]);
                eye.style.setProperty("--wo-eye-speed", moveSpeed);
            });
            clearTimeout(this._timeout);
            this._timeout = setTimeout(() => {
                this._resetEyes(containerBounding);
            }, this._randomInt(2, 10)*1000);
        }
    }

    _calculatePosition(containerBounding, eyeBounding, clientX, clientY) {
        let eyePosX = eyeBounding.x + (eyeBounding.width/2);
        let distanceLeft = Math.abs(containerBounding.x - eyePosX);
        let distanceRight = Math.abs(containerBounding.right - eyePosX);
        let radiusX =  distanceLeft > distanceRight ? distanceLeft : distanceRight;

        let eyePosY = eyeBounding.y + (eyeBounding.height/2);
        let distanceTop = Math.abs(eyePosY - containerBounding.y);
        let distanceBottom = Math.abs(eyePosY - containerBounding.bottom);
        let radiusY =  distanceTop > distanceBottom ? distanceTop : distanceBottom;

        let pointerX = (clientX - eyePosX)/radiusX;
        let pointerY = (clientY - eyePosY)/radiusY;

        let posX = (pointerX + ((pointerX/Math.abs(pointerX)) * (1 - Math.abs(pointerX)) * 0.1));
        let posY = (pointerY + ((pointerY/Math.abs(pointerY)) * (1 - Math.abs(pointerY)) * 0.3));

        return [posX.toFixed(2), posY.toFixed(2)];
    }

    _resetEyes(containerBounding) {
        let posX = this._randomInt(containerBounding.x, containerBounding.right);
        let posY = this._randomInt(containerBounding.y, containerBounding.bottom);
        let movementSpeed = this._randomInt(200, 600);
        this._setEyePosition(containerBounding, posX, posY, movementSpeed);
    }
    _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    _getShadowDomHtml() {
        return `
            <style>
                :host {
                    --wo-eye-posX-default: 0;
                    --wo-eye-posY-default: 0;
                    --wo-eye-speed-default: 100;
                    --wo-eye-space-gap-default: .1em;
                    --wo-eye-layout-curve-outer-default: 10%;
                    --wo-eye-layout-curve-inner-default: 10%;
                    --wo-eye-layout-curve-bottom-default: 70%;
                    --wo-eye-layout-curve-top-default: 70%;
                    --wo-eye-layout-angle-default: 10deg;
                    --wo-eye-layout-lids-default: 0.02em;
                    --wo-eye-layout-size-iris-default: 0.1em;
                    --wo-eye-layout-size-pupil-default: 0.2em;
                    --wo-eye-color-pupil-default: #222;
                    --wo-eye-color-iris-default: #45647a;
                    --wo-eye-color-body-default: #e9e6d4;
                    --wo-eye-color-lids-default: #0002;

                    display: inline-flex;
                    flex-flow: row wrap;
                    gap: 0 var(--wo-eye-space-gap, var(--wo-eye-space-gap-default));
                }

                .eye {
                    background: var(--wo-eye-color-body, var(--wo-eye-color-body-default));
                    font-size: 1em;
                    block-size: 1em;
                    margin-block: -0.1em; /* magic nbr */
                    box-sizing: border-box;
                    aspect-ratio: 1 / 1;
                    box-shadow: inset 0 0 .15em #0003;

                    overflow: hidden;
                    border-radius: 
                        var(--wo-eye-layout-curve-inner, var(--wo-eye-layout-curve-inner-default))
                        var(--wo-eye-layout-curve-top, var(--wo-eye-layout-curve-top-default))
                        var(--wo-eye-layout-curve-outer, var(--wo-eye-layout-curve-outer-default))
                        var(--wo-eye-layout-curve-bottom, var(--wo-eye-layout-curve-bottom-default));
                    border: .02em solid var(--wo-eye-color-lids, var(--wo-eye-color-lids-default));
                    border-top-width: var(--wo-eye-layout-lids, var(--wo-eye-layout-lids-default));
                    border-right-width: var(--wo-eye-layout-lids, var(--wo-eye-layout-lids-default));
                    border-bottom: none;
                    border-left: none;

                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .eye .iris {
                    block-size: 100%;
                    inline-size: 100%;
                    transform: scale(2);
                }
                .eye .iris::after {
                    content: '';
                    display: inline-block;
                    
                    background: var(--wo-eye-color-pupil, var(--wo-eye-color-pupil-default));
                    box-sizing: border-box;
                    border: 
                        var(--wo-eye-layout-size-iris, var(--wo-eye-layout-size-iris-default))
                        solid 
                        var(--wo-eye-color-iris, var(--wo-eye-color-iris-default));
                    
                    block-size: 100%;
                    aspect-ratio: 1 / 1;
                    border-radius: 50%;
                    transform-origin: center center;
                    transition: transform calc(var(--wo-eye-speed) * 1ms) steps(3, end);
                }

                .eye:nth-child(even) {
                    transform: 
                        scale(-0.707107, 0.707107) 
                        rotateZ(calc(-45deg + var(--wo-eye-layout-angle, var(--wo-eye-layout-angle-default))));
                }
                .eye:nth-child(odd) {
                    transform: 
                        scale(0.707107) 
                        rotateZ(calc(-45deg + var(--wo-eye-layout-angle, var(--wo-eye-layout-angle-default))));
                }
                .eye:nth-child(even) .iris::after {
                        transform:
                            scale(-.5, .5)  
                            rotateZ(calc(-45deg + var(--wo-eye-layout-angle, var(--wo-eye-layout-angle-default))))
                            translateX(calc(var(--wo-eye-posX, var(--wo-eye-posX-default)) * 50%)) 
                            translateY(calc(var(--wo-eye-posY, var(--wo-eye-posY-default)) * 40%));
                }
                .eye:nth-child(odd) .iris::after {
                        transform: 
                            scale(.5, .5)
                            rotateZ(calc(45deg - var(--wo-eye-layout-angle, var(--wo-eye-layout-angle-default))))
                            translateX(calc(var(--wo-eye-posX, var(--wo-eye-posX-default)) * 50%)) 
                            translateY(calc(var(--wo-eye-posY, var(--wo-eye-posY-default)) * 40%));
                }
            </style>
        `;
    }

    _addEye() {
        let eye = `<div class="eye">
                <div class="iris"></div>
            </div>`;
        let template = document.createElement("template");
        template.innerHTML = eye;
        this._shadow.appendChild(template.content.cloneNode(true));
    }

    _removeEye() {
        let eyes = this._shadow.querySelectorAll(".eye");
        eyes[eyes.length-1].remove();
    }

    set eyes(value) {
        const nbrOfEyes = parseInt(value);
        if (nbrOfEyes) {
            this.setAttribute('eyes', value);
        } else {
            this.removeAttribute('eyes');
        }
    }

    get eyes() {
      return this.getAttribute('eyes');
    }

    set isglobal(value) {
        const nbrOfEyes = parseInt(value);
        if (value) {
            this.setAttribute('isglobal', "");
        } else {
            this.removeAttribute('isglobal');
        }
    }

    get isglobal() {
      return this.hasAttribute('isglobal');
    }

    _upgradeProperty(prop) {
      if (this.hasOwnProperty(prop)) {
        let value = this[prop];
        delete this[prop];
        this[prop] = value;
      }
    }
}
customElements.define('web-opticon', WebOpticon);