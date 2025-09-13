    document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const scoreElement = document.getElementById('score');
            
            // UI Elements
            const gameOverlay = document.getElementById('gameOverlay');
            const overlayTitle = document.getElementById('overlayTitle');
            const overlayText = document.getElementById('overlayText');
            const startButton = document.getElementById('startButton');
            const resumeButton = document.getElementById('resumeButton');
            const pauseButton = document.getElementById('pauseButton');

            // Game settings
            const gridSize = 20;
            const SNAKE_SPEED = 7; // moves per second. Lower for slower, smoother gameplay.
            
            // Game state
            let tileCount;
            let snake, food, goldenApple, score, direction, changingDirection, goldenAppleTimeout;
            let isPaused = false;
            let gameOver = true;
            let lastRenderTime = 0;
            let animationFrameId;


            function resizeCanvas() {
                const container = canvas.parentElement;
                const size = Math.min(container.clientWidth, container.clientHeight);
                canvas.width = size;
                canvas.height = size;
                tileCount = Math.floor(canvas.width / gridSize);
                if (gameOver) {
                   drawInitialState();
                }
            }
            
            // --- DRAWING FUNCTIONS (Unchanged from previous version) ---
            function drawGrassBackground() {
                ctx.fillStyle = '#a3d489';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < (canvas.width * canvas.height) / 50; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const shade = ['#9bc47c', '#8db06d', '#aad090'][Math.floor(Math.random() * 3)];
                    ctx.fillStyle = shade;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
            
            function drawInitialState() {
                drawGrassBackground();
            }

            function drawSnakePart(snakePart) {
                const partX = snakePart.x * gridSize;
                const partY = snakePart.y * gridSize;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.ellipse(partX + gridSize / 2 + 3, partY + gridSize / 2 + 3, gridSize / 2, gridSize / 2, 0, 0, 2 * Math.PI);
                ctx.fill();
                const gradient = ctx.createRadialGradient(
                    partX + gridSize / 2, partY + gridSize / 2, 1,
                    partX + gridSize / 2, partY + gridSize / 2, gridSize
                );
                gradient.addColorStop(0, '#90EE90');
                gradient.addColorStop(0.5, '#556B2F');
                gradient.addColorStop(1, '#3e4c22');
                ctx.fillStyle = gradient;
                ctx.strokeStyle = '#2a3318';
                ctx.beginPath();
                ctx.roundRect(partX, partY, gridSize, gridSize, [5]);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 2; j++) {
                        ctx.beginPath();
                        ctx.arc(partX + (i + 0.5) * (gridSize / 2), partY + (j + 0.5) * (gridSize / 2), gridSize / 10, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }

            function drawSnake() {
                snake.forEach((part, index) => {
                    drawSnakePart(part);
                    if (index === 0) {
                        const headX = part.x * gridSize;
                        const headY = part.y * gridSize;
                        let eye1X, eye1Y, eye2X, eye2Y;
                        const eyeSize = gridSize / 4;
                        const pupilSize = gridSize / 8;
                        if (direction.x === 1) { 
                            eye1Y = headY + gridSize * 0.25; eye2Y = headY + gridSize * 0.75 - eyeSize;
                            eye1X = eye2X = headX + gridSize * 0.75 - eyeSize / 2;
                        } else if (direction.x === -1) {
                            eye1Y = headY + gridSize * 0.25; eye2Y = headY + gridSize * 0.75 - eyeSize;
                            eye1X = eye2X = headX + gridSize * 0.25 - eyeSize / 2;
                        } else if (direction.y === 1) {
                            eye1X = headX + gridSize * 0.25; eye2X = headX + gridSize * 0.75 - eyeSize;
                            eye1Y = eye2Y = headY + gridSize * 0.75 - eyeSize/2;
                        } else {
                            eye1X = headX + gridSize * 0.25; eye2X = headX + gridSize * 0.75 - eyeSize;
                            eye1Y = eye2Y = headY + gridSize * 0.25 - eyeSize/2;
                        }
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(eye1X + eyeSize/2, eye1Y, eyeSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(eye2X + eyeSize/2, eye2Y + eyeSize/2, eyeSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(eye1X + eyeSize/2, eye1Y, pupilSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(eye2X + eyeSize/2, eye2Y + eyeSize/2, pupilSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                });
            }

            function drawApple(apple, isGolden) {
                 const appleX = apple.x * gridSize;
                 const appleY = apple.y * gridSize;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.beginPath();
                ctx.ellipse(appleX + gridSize / 2 + 2, appleY + gridSize / 2 + 2, gridSize / 2.2, gridSize / 2.2, 0, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = '#654321';
                ctx.fillRect(appleX + gridSize / 2 - 2, appleY - 2, 4, gridSize / 4);
                const gradient = ctx.createRadialGradient(
                    appleX + gridSize * 0.3, appleY + gridSize * 0.3, 1,
                    appleX + gridSize / 2, appleY + gridSize / 2, gridSize / 1.5
                );
                if (isGolden) {
                    gradient.addColorStop(0, '#FFD700'); gradient.addColorStop(1, '#FFA500');
                } else {
                    gradient.addColorStop(0, '#FF6347'); gradient.addColorStop(1, '#B22222');
                }
                ctx.fillStyle = gradient;
                let radius = gridSize / 2 - 1;
                if (isGolden) {
                    const pulse = Math.abs(Math.sin(new Date().getTime() / 200));
                    radius = (gridSize / 2 - 1) * (0.8 + pulse * 0.2);
                }
                ctx.beginPath();
                ctx.arc(appleX + gridSize / 2, appleY + gridSize / 2, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(appleX + gridSize * 0.6, appleY + gridSize * 0.3, gridSize / 8, 0, 2 * Math.PI);
                ctx.fill();
            }

            // --- NEW GAME LOOP ---
            function initGame() {
                snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
                score = 0;
                direction = { x: 0, y: 0 };
                changingDirection = false;
                goldenApple = null;
                scoreElement.textContent = '0';
                isPaused = false;
                gameOver = false;
                
                placeFood();
                
                if (goldenAppleTimeout) clearTimeout(goldenAppleTimeout);
                
                gameOverlay.style.display = 'none';
                
                // For mobile back button
                window.addEventListener('popstate', handleBackButton);
                history.pushState({ gameState: 'playing' }, '');

                // Start the loop
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = window.requestAnimationFrame(gameLoop);
            }

            function gameLoop(currentTime) {
                if (gameOver) {
                    displayGameOver();
                    return;
                }
                
                animationFrameId = window.requestAnimationFrame(gameLoop);
                
                if (isPaused) return;

                const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
                if (secondsSinceLastRender < 1 / SNAKE_SPEED) return;

                lastRenderTime = currentTime;

                update();
                draw();
            }

            function update() {
                if (hasGameEnded()) {
                    gameOver = true;
                    return;
                }
                changingDirection = false;
                moveSnake();
            }

            function draw() {
                drawGrassBackground();
                drawApple(food, false);
                if (goldenApple) drawApple(goldenApple, true);
                drawSnake();
            }
            
            // --- GAME LOGIC FUNCTIONS ---
            function moveSnake() {
                const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
                snake.unshift(head);
                const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
                const didEatGoldenApple = goldenApple && snake[0].x === goldenApple.x && snake[0].y === goldenApple.y;

                if (didEatFood) {
                    score += 10;
                    scoreElement.textContent = score;
                    placeFood();
                    if (score % 100 === 0 && score > 0) placeGoldenApple();
                } else if (didEatGoldenApple) {
                    score += 200;
                    scoreElement.textContent = score;
                    goldenApple = null;
                    if (goldenAppleTimeout) clearTimeout(goldenAppleTimeout);
                } else {
                    snake.pop();
                }
            }
            
            function createRandomCoord() { return { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) } }

            function placeFood() {
                food = createRandomCoord();
                while (snake.some(part => part.x === food.x && part.y === food.y)) food = createRandomCoord();
            }

            function placeGoldenApple() {
                goldenApple = createRandomCoord();
                while (snake.some(part => part.x === goldenApple.x && part.y === goldenApple.y) || (food.x === goldenApple.x && food.y === goldenApple.y)) goldenApple = createRandomCoord();
                if (goldenAppleTimeout) clearTimeout(goldenAppleTimeout);
                goldenAppleTimeout = setTimeout(() => { goldenApple = null; }, 5000);
            }

            function hasGameEnded() {
                for (let i = 4; i < snake.length; i++) if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
                const hitLeftWall = snake[0].x < 0;
                const hitRightWall = snake[0].x >= tileCount;
                const hitTopWall = snake[0].y < 0;
                const hitBottomWall = snake[0].y >= tileCount;
                return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
            }

            // --- UI AND PAUSE LOGIC ---
            function togglePause() {
                if (gameOver) return;
                isPaused = !isPaused;
                if (isPaused) {
                    overlayTitle.textContent = 'Paused';
                    overlayText.textContent = 'Game is paused';
                    startButton.style.display = 'none';
                    resumeButton.style.display = 'block';
                    gameOverlay.style.display = 'flex';
                } else {
                    gameOverlay.style.display = 'none';
                }
            }
            
            function displayGameOver() {
                if (goldenAppleTimeout) clearTimeout(goldenAppleTimeout);
                overlayTitle.textContent = 'Game Over!';
                overlayText.textContent = `Your final score is ${score}.`;
                startButton.textContent = 'Restart';
                resumeButton.style.display = 'none';
                startButton.style.display = 'block';
                gameOverlay.style.display = 'flex';
                window.removeEventListener('popstate', handleBackButton);
            }
            
            function handleBackButton(event) {
                if (!isPaused && !gameOver) {
                    togglePause();
                }
            }

            // --- CONTROLS ---
            function changeDirection(event) {
                const { key } = event;
                if (changingDirection) return;
                const goingUp = direction.y === -1, goingDown = direction.y === 1, goingRight = direction.x === 1, goingLeft = direction.x === -1;
                if ((key === 'ArrowUp' || key === 'w') && !goingDown) { direction = { x: 0, y: -1 }; changingDirection = true;}
                else if ((key === 'ArrowDown' || key === 's') && !goingUp) { direction = { x: 0, y: 1 }; changingDirection = true;}
                else if ((key === 'ArrowLeft' || key === 'a') && !goingRight) { direction = { x: -1, y: 0 }; changingDirection = true;}
                else if ((key === 'ArrowRight' || key === 'd') && !goingLeft) { direction = { x: 1, y: 0 }; changingDirection = true;}
            }

            // --- EVENT LISTENERS ---
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') togglePause();
                else changeDirection(e);
            });
            startButton.addEventListener('click', initGame);
            resumeButton.addEventListener('click', togglePause);
            pauseButton.addEventListener('click', togglePause);
            document.getElementById('btn-up').addEventListener('click', () => changeDirection({ key: 'ArrowUp' }));
            document.getElementById('btn-down').addEventListener('click', () => changeDirection({ key: 'ArrowDown' }));
            document.getElementById('btn-left').addEventListener('click', () => changeDirection({ key: 'ArrowLeft' }));
            document.getElementById('btn-right').addEventListener('click', () => changeDirection({ key: 'ArrowRight' }));
            window.addEventListener('resize', resizeCanvas);
            
            // Initial setup
            resizeCanvas();
        });