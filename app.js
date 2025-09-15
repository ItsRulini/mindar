class FootGGApp {
    static instance;
    //static id = FootGGApp.unique();

    constructor() {
        if (FootGGApp.instance) {
            return FootGGApp.instance;
        }
        FootGGApp.instance = this;

        this.currentSection = 'camera';
        this.arScene = null;
        this.arStarted = false;
        this.init();
    }

    // static unique() {
    //     if (!this._idCounter) this._idCounter = 1;
    //     else this._idCounter++;
    //     return `FootGGApp-${this._idCounter}`;
    // }

    getInstance() {
        return FootGGApp.instance;
    }

    init() {
        this.setupNavigation();
        this.setupARControls();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-button');
        const sections = document.querySelectorAll('.section');

        if(this.currentSection === 'camera') { // Abrir sección cámara por defecto
            // Ocultar todas las secciones
            sections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            // Mostrar la sección seleccionada
            const activeSection = document.getElementById(`camera-section`);
            if (activeSection) {
                activeSection.classList.add('active');
                activeSection.style.display = 'block';
            }
        }

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.getAttribute('data-section');

                // Remover clase active de todos los botones
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Ocultar todas las secciones
                sections.forEach(section => {
                    section.classList.remove('active');
                    section.style.display = 'none';
                });

                // Mostrar la sección seleccionada
                const activeSection = document.getElementById(`${targetSection}-section`);
                if (activeSection) {
                    activeSection.classList.add('active');
                    activeSection.style.display = 'block';
                }

                // Si cambiamos de sección y AR está activo, detenerlo
                if (targetSection !== 'camera' && this.arStarted) {
                    this.stopAR();
                }

                this.currentSection = targetSection;
            });
            
        });
    }

    setupARControls() {
        const startBtn = document.getElementById('startArBtn');
        const stopBtn = document.getElementById('stopArBtn');
        const resetBtn = document.getElementById('resetArBtn');

        if (startBtn) startBtn.addEventListener('click', () => this.startAR());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopAR());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAR());
    }

    updateStatus(message, type = 'normal') {
        const statusElement = document.getElementById('arStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-indicator ${type}`;
        }
        //console.log(`[AR Status] ${message}`);
    }

    async startAR() {
        try {
            this.updateStatus('Inicializando...', 'loading');

            const arContainer = document.getElementById('arScene');
            if (!arContainer) {
            throw new Error('Contenedor AR no encontrado');
            }

            // limpiar cualquier escena previa
            arContainer.innerHTML = '';

            // Verificar que los assets existen (opcional)
            await this.checkAssets();

            // Crear la escena usando tu snippet
            const scene = document.createElement('a-scene');
            scene.setAttribute('mindar-image', 'imageTargetSrc: targets/mexico.mind;');
            scene.setAttribute('embedded', '');
            scene.style.width = '100%';
            scene.style.height = '100%';

            // Assets
            scene.innerHTML = `
            <a-assets>
                <a-asset-item id="avatarModel" src="3d/piramide.glb"></a-asset-item>
            </a-assets>

            <a-camera position="0 0 0"></a-camera>

            <a-entity mindar-image-target="targetIndex: 0">
                <a-gltf-model src="#avatarModel" scale="0.1 0.1 0.1" position="0 -1 0"
                animation="property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true">
                </a-gltf-model>
            </a-entity>
            `;

            arContainer.appendChild(scene);

            // Eventos para debug
            scene.addEventListener('loaded', () => {
            console.log('🚀 Escena A-Frame cargada');
            this.updateStatus('Escena cargada - Apunta a la imagen', 'normal');
            });

            scene.addEventListener('renderstart', () => {
            console.log('🎬 Renderizado iniciado');
            this.updateStatus('✅ AR Activo - Busca el objetivo', 'normal');
            this.arStarted = true;

            const startBtn = document.getElementById('startArBtn');
            const stopBtn = document.getElementById('stopArBtn');
            if (startBtn) startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            });

            scene.addEventListener('arReady', () => {
            console.log('🧠 MindAR inicializado correctamente');
            this.updateStatus('✅ Sistema AR listo', 'normal');
            });

            this.arScene = scene;

        } catch (error) {
            console.error('💥 Error crítico al iniciar AR:', error);
            this.updateStatus('❌ Error crítico', 'error');
        }
    }


    async checkAssets() {
        const assetsToCheck = [
            { name: 'Imagen objetivo', path: 'targets/mexico.mind' },
            { name: 'Modelo 3D', path: '3d/piramide.glb' },
            { name: 'Imagen de plano', path: 'si.png' }
        ];

        console.log('🔍 Verificando assets...');
        
        for (const asset of assetsToCheck) {
            try {
                const response = await fetch(asset.path, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ ${asset.name}: Encontrado`);
                } else {
                    console.warn(`⚠️ ${asset.name}: No encontrado (${response.status})`);
                }
            } catch (e) {
                console.error(`❌ ${asset.name}: Error al verificar - ${e.message}`);
            }
        }
    }

    stopAR() {
        console.log('🛑 Deteniendo AR...');
        
        if (this.arScene) {
            const arContainer = document.getElementById('arScene');
            if (arContainer) {
                arContainer.innerHTML = '';
            }
            this.arScene = null;
        }
        
        this.arStarted = false;
        this.updateStatus('⏹️ AR Detenido');
        
        const startBtn = document.getElementById('startArBtn');
        const stopBtn = document.getElementById('stopArBtn');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }

    resetAR() {
        console.log('🔄 Reiniciando AR...');
        this.stopAR();
        setTimeout(() => {
            this.updateStatus('🔄 Listo para iniciar');
        }, 500);
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Inicializando FootGG App...');
    window.footGGApp = new FootGGApp();
    // Print the unique id of the instance
    //console.log(window.footGGApp.constructor.id);
});