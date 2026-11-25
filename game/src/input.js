// Keyboard and mouse input for Midnight Sizzle. The game reads this one
// object each frame; nothing else touches the DOM events.
export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    interactHeld: false,
    interactPressed: false,
    servePressed: false,
    restartPressed: false,
    mutePressed: false,
    anyKeyPressed: false,
    // Click-to-walk: a canvas point the chef walks toward, or null.
    clickTarget: null,
    // True for one frame after a mouse click (used to interact in range).
    clicked: false,
    clickX: 0,
    clickY: 0,
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (event.code === 'KeyE') input.interactHeld = true;
      return;
    }
    const dir = KEYMAP[event.code];
    if (dir) {
      input[dir] = true;
      event.preventDefault();
    } else if (event.code === 'KeyE') {
      input.interactHeld = true;
      input.interactPressed = true;
    } else if (event.code === 'Space') {
      input.servePressed = true;
      event.preventDefault();
    } else if (event.code === 'KeyR') {
      input.restartPressed = true;
    } else if (event.code === 'KeyM') {
      input.mutePressed = true;
    } else if (event.code === 'Enter') {
      input.anyKeyPressed = true;
    }
    if (dir || event.code === 'KeyE' || event.code === 'Space') input.anyKeyPressed = true;
  });

  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) input[dir] = false;
    if (event.code === 'KeyE') input.interactHeld = false;
  });

  canvas.addEventListener('mousedown', (event) => {
    const point = canvasPoint(event);
    input.clickTarget = point;
    input.clicked = true;
    input.clickX = point.x;
    input.clickY = point.y;
    input.anyKeyPressed = true;
  });

  // Edge-triggered flags are consumed once per frame by the game loop.
  input.consumeFrame = function consumeFrame() {
    input.interactPressed = false;
    input.servePressed = false;
    input.restartPressed = false;
    input.mutePressed = false;
    input.anyKeyPressed = false;
    input.clicked = false;
  };

  return input;
}
