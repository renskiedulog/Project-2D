const canvas = document.querySelector("canvas"),
  c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

// Animations Sprite
class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
  }) {
    this.position = position;
    this.width = 50;
    this.height = 150;
    this.image = new Image();
    this.image.src = imageSrc;
    this.scale = scale;
    this.framesMax = framesMax;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 10;
    this.offset = offset;
  }

  draw() {
    c.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    );
  }

  animateFrames() {
    this.framesElapsed++;

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++;
      } else {
        this.framesCurrent = 0;
      }
    }
  }

  update() {
    this.draw();
    this.animateFrames();
  }
}

// Background
const background = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  imageSrc: "background.png",
});

const shop = new Sprite({
  position: {
    x: 700,
    y: 223,
  },
  imageSrc: "shop.png",
  scale: 2,
  framesMax: 6,
});

class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined },
    framesHold = 6,
    facing,
    tagSrc,
    name,
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset,
    });
    this.velocity = velocity;
    this.width = 50;
    this.height = 150;
    this.lastkey;
    this.jumpCount = 0;
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height,
    };
    this.isAttacking;
    this.health = 100;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = framesHold;
    this.sprites = sprites;
    (this.facing = facing), (this.isHit = false);
    this.dead = false;
    this.tagSrc = tagSrc;
    this.tagImg = new Image();
    this.prevFacing;
    this.name = name;

    for (const sprite in sprites) {
      sprites[sprite].image = new Image();
      sprites[sprite].image.src = sprites[sprite].imageSrc;
    }
  }

  update() {
    this.draw();
    if (!this.dead) this.animateFrames();

    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    c.fillStyle = "red";
    // draw the attack box
    // c.fillRect(
    //   this.attackBox.position.x,
    //   this.attackBox.position.y,
    //   this.attackBox.width,
    //   this.attackBox.height
    // );
    // c.fillStyle = "blue";
    // c.fillRect(this.position.x, this.position.y, this.width, this.height);

    if (
      this.position.y + this.height + this.velocity.y >=
      canvas.height - 120
    ) {
      this.velocity.y = 0;
      this.jumpCount = 0;
      this.position.y = 310;
    } else this.velocity.y += gravity;
  }

  attack() {
    this.isAttacking = true;
    this.switchSprite("attack");
    setTimeout(() => {
      this.isAttacking = false;
    }, 2000);
  }

  takeHit() {
    setTimeout(() => {
      this.isHit = false;
    }, 1000);
    if (this.health - Math.floor(Math.random() * 30 + 1) > 0) {
      this.health -= Math.floor(Math.random() * 30 + 1);
    } else {
      this.health = 0;
    }
    document.querySelector(`#${this.name}`).style.width = this.health + "%";
    if (this.health <= 0) {
      document.querySelector(`#${this.name}`).style.width = this.health + "%";
      this.switchSprite("death");
    } else this.switchSprite("takeHit");
  }

  tag() {
    if (!this.isHit) {
      this.tagImg.src = this.tagSrc;
      c.drawImage(this.tagImg, this.position.x, this.position.y - 50, 50, 50);
    }
  }

  switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true;
      return;
    }

    // overriding all other animations with the attack animation
    if (
      this.image === this.sprites.attack.image &&
      this.framesCurrent < this.sprites.attack.framesMax - 1
    )
      return;

    // override when fighter gets hit
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return;

    switch (sprite) {
      case "idle":
        if (this.image !== this.sprites.idle.image) {
          if (this.facing == "left") {
            this.sprites.idle.image.src = this.sprites.idle.leftSrc;
          } else {
            this.sprites.idle.image.src = this.sprites.idle.imageSrc;
          }
          this.image = this.sprites.idle.image;
          this.framesMax = this.sprites.idle.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case "run":
        if (
          this.image !== this.sprites.run.image ||
          (this.image === this.sprites.run.image &&
            this.facing !== this.prevFacing)
        ) {
          if (this.facing == "left") {
            this.sprites.run.image.src = this.sprites.run.leftSrc;
          } else {
            this.sprites.run.image.src = this.sprites.run.imageSrc;
          }
          this.image = this.sprites.run.image;
          this.framesMax = this.sprites.run.framesMax;
          this.framesCurrent = 0;
        }
        this.prevFacing = this.facing;
        break;
      case "jump":
        if (this.image !== this.sprites.jump.image) {
          if (this.facing == "left") {
            this.sprites.jump.image.src = this.sprites.jump.leftSrc;
          } else {
            this.sprites.jump.image.src = this.sprites.jump.imageSrc;
          }
          this.image = this.sprites.jump.image;
          this.framesMax = this.sprites.jump.framesMax;
          this.framesCurrent = 0;
        }
        break;

      case "fall":
        if (this.image !== this.sprites.fall.image) {
          if (this.facing == "left") {
            this.sprites.fall.image.src = this.sprites.fall.leftSrc;
          } else {
            this.sprites.fall.image.src = this.sprites.fall.imageSrc;
          }
          this.image = this.sprites.fall.image;
          this.framesMax = this.sprites.fall.framesMax;
          this.framesCurrent = 0;
        }
        break;

      case "attack":
        if (this.image !== this.sprites.attack.image) {
          if (this.facing == "left") {
            this.sprites.attack.image.src = this.sprites.attack.leftSrc;
          } else {
            this.sprites.attack.image.src = this.sprites.attack.imageSrc;
          }
          this.image = this.sprites.attack.image;
          this.framesMax = this.sprites.attack.framesMax;
          this.framesCurrent = 0;
        }
        break;

      case "takeHit":
        if (this.image !== this.sprites.takeHit.image) {
          if (this.facing == "left") {
            this.sprites.takeHit.image.src = this.sprites.takeHit.leftSrc;
          } else {
            this.sprites.takeHit.image.src = this.sprites.takeHit.imageSrc;
          }
          this.image = this.sprites.takeHit.image;
          this.framesMax = this.sprites.takeHit.framesMax;
          this.framesCurrent = 0;
        }
        break;

      case "death":
        if (this.image !== this.sprites.death.image) {
          if (this.facing == "left") {
            this.sprites.death.image.src = this.sprites.death.leftSrc;
          } else {
            this.sprites.death.image.src = this.sprites.death.imageSrc;
          }
          this.image = this.sprites.death.image;
          this.framesMax = this.sprites.death.framesMax;
          this.framesCurrent = 0;
        }
        break;
    }
  }
}

const player = new Fighter({
  position: {
    x: 300,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  offset: {
    x: 280,
    y: 193,
  },
  imageSrc: "./Assets/Assassin/Sprites/Idle.png",
  framesMax: 8,
  scale: 3,
  sprites: {
    idle: {
      imageSrc: "./Assets/Assassin/Sprites/Idle.png",
      framesMax: 8,
      leftSrc: "./Assets/Assassin/Sprites/Idle - Copy.png",
    },
    run: {
      imageSrc: "./Assets/Assassin/Sprites/Run.png",
      framesMax: 8,
      leftSrc: "./Assets/Assassin/Sprites/Run - Copy.png",
    },
    jump: {
      imageSrc: "./Assets/Assassin/Sprites/Jump.png",
      framesMax: 2,
      leftSrc: "./Assets/Assassin/Sprites/Jump - Copy.png",
    },
    fall: {
      imageSrc: "./Assets/Assassin/Sprites/Fall.png",
      framesMax: 2,
      leftSrc: "./Assets/Assassin/Sprites/Fall - Copy.png",
    },
    attack: {
      imageSrc: "./Assets/Assassin/Sprites/Attack1.png",
      framesMax: 6,
      leftSrc: "./Assets/Assassin/Sprites/Attack1 - Copy.png",
    },
    takeHit: {
      imageSrc: "./Assets/Assassin/Sprites/Take Hit - white silhouette.png",
      framesMax: 4,
      leftSrc:
        "./Assets/Assassin/Sprites/Take Hit - white silhouette - Copy.png",
    },
    death: {
      imageSrc: "./Assets/Assassin/Sprites/Death.png",
      framesMax: 6,
      leftSrc: "./Assets/Assassin/Sprites/Death - Copy.png",
    },
  },
  attackBox: {
    offset: {
      x: 80,
      y: 50,
    },
    width: 200,
    height: 50,
  },
  facing: "right",
  tagSrc: "p-tag-1.png",
  name: "player-1",
});

const enemy = new Fighter({
  position: {
    x: 700,
    y: 100,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  imageSrc: "./Assets/Swordmaster/Sprites/Idle.png",
  framesMax: 4,
  scale: 3,
  offset: {
    x: 280,
    y: 211,
  },
  sprites: {
    idle: {
      imageSrc: "./Assets/Swordmaster/Sprites/Idle.png",
      framesMax: 4,
      leftSrc: "./Assets/Swordmaster/Sprites/Idle - Copy.png",
    },
    run: {
      imageSrc: "./Assets/Swordmaster/Sprites/Run.png",
      framesMax: 8,
      leftSrc: "./Assets/Swordmaster/Sprites/Run - Copy.png",
    },
    jump: {
      imageSrc: "./Assets/Swordmaster/Sprites/Jump.png",
      framesMax: 2,
      leftSrc: "./Assets/Swordmaster/Sprites/Jump - Copy.png",
    },
    fall: {
      imageSrc: "./Assets/Swordmaster/Sprites/Fall.png",
      framesMax: 2,
      leftSrc: "./Assets/Swordmaster/Sprites/Fall - Copy.png",
    },
    attack: {
      imageSrc: "./Assets/Swordmaster/Sprites/Attack1.png",
      framesMax: 4,
      leftSrc: "./Assets/Swordmaster/Sprites/Attack1 - Copy.png",
    },
    takeHit: {
      imageSrc: "./Assets/Swordmaster/Sprites/Take hit.png",
      framesMax: 3,
      leftSrc: "./Assets/Swordmaster/Sprites/Take hit - Copy.png",
    },
    death: {
      imageSrc: "./Assets/Swordmaster/Sprites/Death.png",
      framesMax: 7,
      leftSrc: "./Assets/Swordmaster/Sprites/Death - Copy.png",
    },
  },
  framesHold: 10,
  attackBox: {
    offset: {
      x: -230,
      y: 50,
    },
    width: 220,
    height: 50,
  },
  facing: "left",
  tagSrc: "p-tag-2.png",
  name: "player-2",
});

// Keys Array
const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  ArrowLeft: {
    pressed: false,
  },
};

// Game Mechanics And Physics
function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >=
      rectangle2.position.x &&
    rectangle1.attackBox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
      rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  );
}

function determineWinner(player, enemy, timerId) {
  clearTimeout(timerId);
  // if (player.health === enemy.health) {
  //   document.querySelector(".display-text").textContent = "DRAW!";
  // } else if (player.health > enemy.health) {
  //   document.querySelector(".display-text").textContent = "Player 1 WINS!";
  // } else if (player.health < enemy.health) {
  //   document.querySelector(".display-text").textContent = "Player 2 WINS!";
  // }
}

let timer = 60;
let timerId;
function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000);
    timer--;
    document.querySelector(".timer").textContent = timer;
  }
  if (timer === 0) {
    determineWinner(player, enemy, timerId);
  }
}

decreaseTimer();

function animate() {
  window.requestAnimationFrame(animate);
  background.update();
  shop.update();
  player.update();
  enemy.update();
  player.tag();
  enemy.tag();

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // Determine Death
  if (enemy.dead || player.dead) {
    enemy.lastKey = null;
    player.lastKey = null;
  }

  // player movement
  if (keys.a.pressed && player.lastKey === "a") {
    if (player.position.x > 0) {
      player.velocity.x = -5;
      player.facing = "left";
      player.attackBox.offset.x = -227;
    }
    player.switchSprite("run");
  } else if (keys.d.pressed && player.lastKey === "d") {
    if (player.position.x < canvas.width - 50) {
      player.velocity.x = 5;
      player.facing = "right";
      player.attackBox.offset.x = 80;
    }
    player.switchSprite("run");
  } else {
    player.switchSprite("idle");
  }

  // jumping
  if (player.velocity.y < 0) {
    player.switchSprite("jump");
  } else if (player.velocity.y > 0) {
    player.switchSprite("fall");
  }

  // Enemy movement
  if (keys.ArrowLeft.pressed && enemy.lastKey === "ArrowLeft") {
    if (enemy.position.x > 0) {
      enemy.velocity.x = -5;
      enemy.facing = "left";
      enemy.attackBox.offset.x = -210;
    }
    enemy.switchSprite("run");
  } else if (keys.ArrowRight.pressed && enemy.lastKey === "ArrowRight") {
    if (enemy.position.x < canvas.width - 50) {
      enemy.velocity.x = 5;
      enemy.facing = "right";
      enemy.attackBox.offset.x = 50;
    }
    enemy.switchSprite("run");
  } else {
    enemy.switchSprite("idle");
  }

  // jumping
  if (enemy.velocity.y < 0) {
    enemy.switchSprite("jump");
  } else if (enemy.velocity.y > 0) {
    enemy.switchSprite("fall");
  }

  // detect for collision & enemy gets hit
  if (
    rectangularCollision({
      rectangle1: player,
      rectangle2: enemy,
    }) &&
    player.isAttacking &&
    player.framesCurrent === 4
  ) {
    if (enemy.isHit == false) {
      enemy.isHit = true;
      enemy.takeHit();
    }
    player.isAttacking = false;
  }

  // this is where our player gets hit
  if (
    rectangularCollision({
      rectangle1: enemy,
      rectangle2: player,
    }) &&
    enemy.isAttacking &&
    enemy.framesCurrent === 2
  ) {
    if (player.isHit == false) {
      player.isHit = true;
      player.takeHit();
    }
    enemy.isAttacking = false;
  }

  // end game based on health
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner(player, enemy, timerId);
  }
}
animate();

window.addEventListener("keydown", (event) => {
  if (player.dead || enemy.dead) return;
  if (!player.dead) {
    switch (event.key) {
      case "d":
        keys.d.pressed = true;
        player.lastKey = "d";
        break;
      case "a":
        keys.a.pressed = true;
        player.lastKey = "a";
        break;
      case "w":
        if (player.jumpCount != 2) {
          player.jumpCount += 1;
          player.velocity.y = -15;
          break;
        }
        break;
      case " ":
        player.attack();
        break;
    }
  }

  if (!enemy.dead) {
    switch (event.key) {
      case "ArrowRight":
        keys.ArrowRight.pressed = true;
        enemy.lastKey = "ArrowRight";
        break;
      case "ArrowLeft":
        keys.ArrowLeft.pressed = true;
        enemy.lastKey = "ArrowLeft";
        break;
      case "ArrowUp":
        if (enemy.jumpCount != 2) {
          enemy.jumpCount += 1;
          enemy.velocity.y = -15;
          break;
        }
        break;
      case "ArrowDown":
        enemy.attack();
        break;
    }
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "d":
      keys.d.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
  }

  // enemy keys
  switch (event.key) {
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
  }
});
