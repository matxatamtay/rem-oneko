(function remOneko() {
  const EXISTING = document.getElementById("rem-oneko");
  if (EXISTING) EXISTING.remove();

  const isReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)") === true ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;

  if (isReducedMotion) return;

  // Đổi URL này thành ảnh sprite sheet Rem của mày
  // Ảnh của mày: 1774 x 887, layout 8 cột x 4 hàng
  const SPRITE_URL = "https://your-domain.com/rem-sprite.png";

  const COLS = 8;
  const ROWS = 4;

  // Size hiển thị trên màn hình. Muốn to/nhỏ thì sửa số này.
  const FRAME_SIZE = 64;

  const nekoEl = document.createElement("div");

  let nekoPosX = 80;
  let nekoPosY = 80;

  let mousePosX = window.innerWidth / 2;
  let mousePosY = window.innerHeight / 2;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  let lastFrameTimestamp;

  const nekoSpeed = 12;

  /*
    Tọa độ frame: [cột, hàng]
    Cột/hàng tính từ 0.
    Ảnh layout 8x4:
      cột: 0 1 2 3 4 5 6 7
      hàng: 0 1 2 3
  */
  const spriteSets = {
    idle: [[1, 2]],
    alert: [[7, 3]],

    tired: [[3, 2]],
    sleeping: [
      [2, 0],
      [2, 1],
    ],

    scratchSelf: [
      [5, 0],
      [6, 0],
      [7, 0],
    ],

    scratchWallN: [
      [0, 0],
      [0, 1],
    ],
    scratchWallS: [
      [7, 1],
      [6, 2],
    ],
    scratchWallE: [
      [2, 2],
      [2, 3],
    ],
    scratchWallW: [
      [4, 0],
      [4, 1],
    ],

    N: [
      [6, 3],
      [7, 2],
    ],
    NE: [
      [5, 1],
      [5, 2],
    ],
    E: [
      [3, 0],
      [3, 1],
    ],
    SE: [
      [4, 2],
      [4, 3],
    ],
    S: [
      [6, 3],
      [7, 2],
    ],
    SW: [
      [0, 2],
      [0, 3],
    ],
    W: [
      [1, 0],
      [1, 1],
    ],
    NW: [
      [5, 3],
      [6, 1],
    ],
  };

  function init() {
    nekoEl.id = "rem-oneko";
    nekoEl.ariaHidden = "true";

    nekoEl.style.width = `${FRAME_SIZE}px`;
    nekoEl.style.height = `${FRAME_SIZE}px`;
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - FRAME_SIZE / 2}px`;
    nekoEl.style.top = `${nekoPosY - FRAME_SIZE / 2}px`;
    nekoEl.style.zIndex = "2147483647";

    nekoEl.style.backgroundImage = `url("${SPRITE_URL}")`;
    nekoEl.style.backgroundRepeat = "no-repeat";

    /*
      Ép toàn bộ ảnh sprite về đúng grid hiển thị:
      8 * 64 = 512px ngang
      4 * 64 = 256px dọc

      Vì vậy dù ảnh gốc là 1774x887 vẫn dùng được.
    */
    nekoEl.style.backgroundSize = `${COLS * FRAME_SIZE}px ${ROWS * FRAME_SIZE}px`;

    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", onMouseMove);

    window.requestAnimationFrame(onAnimationFrame);
  }

  function onMouseMove(event) {
    mousePosX = event.clientX;
    mousePosY = event.clientY;
  }

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) {
      document.removeEventListener("mousemove", onMouseMove);
      return;
    }

    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }

    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprites = spriteSets[name] || spriteSets.idle;
    const sprite = sprites[frame % sprites.length];
    const col = sprite[0];
    const row = sprite[1];

    nekoEl.style.backgroundPosition =
      `${-col * FRAME_SIZE}px ${-row * FRAME_SIZE}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      idleAnimation == null
    ) {
      const availableIdleAnimations = ["sleeping", "scratchSelf"];

      if (nekoPosX < FRAME_SIZE) {
        availableIdleAnimations.push("scratchWallW");
      }

      if (nekoPosY < FRAME_SIZE) {
        availableIdleAnimations.push("scratchWallN");
      }

      if (nekoPosX > window.innerWidth - FRAME_SIZE) {
        availableIdleAnimations.push("scratchWallE");
      }

      if (nekoPosY > window.innerHeight - FRAME_SIZE) {
        availableIdleAnimations.push("scratchWallS");
      }

      idleAnimation =
        availableIdleAnimations[
          Math.floor(Math.random() * availableIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }

        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));

        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;

      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);

        if (idleAnimationFrame > 12) {
          resetIdleAnimation();
        }
        break;

      default:
        setSprite("idle", 0);
        return;
    }

    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;

    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < FRAME_SIZE * 1.5) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = "";

    direction += diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";

    setSprite(direction || "idle", frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(
      Math.max(FRAME_SIZE / 2, nekoPosX),
      window.innerWidth - FRAME_SIZE / 2
    );

    nekoPosY = Math.min(
      Math.max(FRAME_SIZE / 2, nekoPosY),
      window.innerHeight - FRAME_SIZE / 2
    );

    nekoEl.style.left = `${nekoPosX - FRAME_SIZE / 2}px`;
    nekoEl.style.top = `${nekoPosY - FRAME_SIZE / 2}px`;
  }

  init();
})();
