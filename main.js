// Configuración de las partículas
const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');

// Variables para el mouse
let mouseX = 0;
let mouseY = 0;
let mouseActive = false;

// Ajustar canvas al tamaño de la ventana
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

// Clase para las partículas
class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.baseSpeedX = this.speedX;
        this.baseSpeedY = this.speedY;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) {
            this.speedX *= -1;
            this.baseSpeedX = this.speedX;
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.speedY *= -1;
            this.baseSpeedY = this.speedY;
        }
        
        if (mouseActive) {
            this.reactToMouse();
        } else {
            this.speedX += (this.baseSpeedX - this.speedX) * 0.05;
            this.speedY += (this.baseSpeedY - this.speedY) * 0.05;
        }
    }
    
    reactToMouse() {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;
        
        if (distance < maxDistance) {
            const force = (1 - distance / maxDistance) * 0.5;
            const angle = Math.atan2(dy, dx);
            
            this.speedX += Math.cos(angle) * force;
            this.speedY += Math.sin(angle) * force;
            
            const maxSpeed = 3;
            const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
            if (currentSpeed > maxSpeed) {
                this.speedX = (this.speedX / currentSpeed) * maxSpeed;
                this.speedY = (this.speedY / currentSpeed) * maxSpeed;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
    }
}

// Crear partículas
const particles = [];
const particleCount = 180;

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

// Conectar partículas
function connectParticles() {
    const maxDistance = 180;
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
                let opacity = 0.3 * (1 - distance / maxDistance);
                
                if (mouseActive) {
                    const midX = (particles[i].x + particles[j].x) / 2;
                    const midY = (particles[i].y + particles[j].y) / 2;
                    const distToMouse = Math.sqrt(
                        Math.pow(midX - mouseX, 2) + 
                        Math.pow(midY - mouseY, 2)
                    );
                    
                    if (distToMouse < 150) {
                        opacity += 0.4 * (1 - distToMouse / 150);
                    }
                }
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(opacity, 0.8)})`;
                ctx.lineWidth = 1.2;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Dibujar glow del mouse
function drawMouseGlow() {
    if (!mouseActive) return;
    
    const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 150);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

// Animación
function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMouseGlow();
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    connectParticles();
    
    requestAnimationFrame(animate);
}

animate();

// Eventos del mouse
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
});

canvas.addEventListener('mouseleave', () => {
    mouseActive = false;
});

canvas.addEventListener('mouseenter', () => {
    mouseActive = true;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    mouseActive = true;
});

canvas.addEventListener('touchend', () => {
    mouseActive = false;
});

// Reajustar canvas
window.addEventListener('resize', () => {
    resizeCanvas();
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].x = Math.random() * canvas.width;
        particles[i].y = Math.random() * canvas.height;
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
// ========== MODAL Y CUENTA REGRESIVA ==========
const modal = document.getElementById('birthdayModal');
const birthdayStat = document.getElementById('birthday-stat');
const closeBtn = document.querySelector('.close-modal');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const nextBirthdayText = document.getElementById('nextBirthdayText');
const daysCounter = document.getElementById('days-counter');

// Función para calcular los días hasta el próximo cumpleaños (31 de agosto)
function calculateBirthday() {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Crear fecha del próximo cumpleaños (31 de agosto)
    let nextBirthday = new Date(currentYear, 7, 31); // Mes 7 = Agosto (0-index)
    
    // Si ya pasó, calcular para el próximo año
    if (today > nextBirthday) {
        nextBirthday = new Date(currentYear + 1, 7, 31);
    }
    
    return nextBirthday;
}

// Función para actualizar la cuenta regresiva
function updateCountdown() {
    const nextBirthday = calculateBirthday();
    const now = new Date();
    
    // Calcular diferencia en milisegundos
    const diff = nextBirthday - now;
    
    // Calcular días, horas, minutos, segundos
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Actualizar el contador de días en la card
    if (daysCounter) {
        daysCounter.textContent = days;
    }
    
    // Actualizar el modal
    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours < 10 ? '0' + hours : hours;
    if (minutesEl) minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
    if (secondsEl) secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
    
    // Actualizar texto del próximo cumpleaños
    if (nextBirthdayText) {
        const year = nextBirthday.getFullYear();
        nextBirthdayText.textContent = `Próximo cumpleaños: 31 de agosto, ${year}`;
    }
}

// Abrir modal al hacer clic en los días
if (birthdayStat) {
    birthdayStat.addEventListener('click', () => {
        modal.style.display = 'flex';
        updateCountdown(); // Actualizar al abrir
    });
}

// Cerrar modal
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Actualizar la cuenta regresiva cada segundo
setInterval(updateCountdown, 1000);

// Actualizar inmediatamente al cargar
updateCountdown();

// ========== DESCARGA DE CV ==========
const cvBtn = document.getElementById('download-cv');
if (cvBtn) {
    cvBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Aquí puedes poner la ruta de tu archivo PDF
        const cvUrl = 'assets/CV-SALDARRIAGA-CRUZ-DARLIN-JOSUE10-2026.pdf'; // Cambia esto a la ruta correcta
        
        // Crear un enlace temporal para descargar
        const link = document.createElement('a');
        link.href = cvUrl;
        link.download = 'CV-SALDARRIAGA-CRUZ-DARLIN-JOSUE10-2026.pdf'; // Nombre del archivo al descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}


// ========== SLIDER DE PROYECTOS ==========
const slides = document.querySelectorAll('.slider-slide');
const prevBtn = document.querySelector('.slider-control.prev');
const nextBtn = document.querySelector('.slider-control.next');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));
    
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
    currentSlide = index;
}

function nextSlide() {
    let next = currentSlide + 1;
    if (next >= slides.length) {
        next = 0;
    }
    showSlide(next);
}

function prevSlide() {
    let prev = currentSlide - 1;
    if (prev < 0) {
        prev = slides.length - 1;
    }
    showSlide(prev);
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showSlide(index));
    });
    
    // Auto-slide cada 5 segundos
    setInterval(nextSlide, 5000);
}
