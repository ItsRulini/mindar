class FootGGApp {
    constructor() {
        this.currentSection = 'camera';
        this.arScene = null;
        this.arStarted = false;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupARControls();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-button');
        const sections = document.querySelectorAll('.section');

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
        console.log(`[AR Status] ${message}`);
    }

    async startAR() {
        try {
            this.updateStatus('Inicializando...', 'loading');
            
            // Crear la escena AR
            const arContainer = document.getElementById('arScene');
            if (!arContainer) {
                throw new Error('Contenedor AR no encontrado');
            }
            
            // Limpiar contenido anterior
            arContainer.innerHTML = '';

            // Verificar que los archivos existen
            await this.checkAssets();

            // Crear la escena A-Frame
            const scene = document.createElement('a-scene');
            scene.setAttribute('mindar-image', 'imageTargetSrc: targets/mexico.mind;');
            scene.setAttribute('color-space', 'sRGB');
            scene.setAttribute('renderer', 'colorManagement: true, physicallyCorrectLights');
            scene.setAttribute('vr-mode-ui', 'enabled: false');
            scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
            scene.setAttribute('embedded', true);
            scene.style.width = '100%';
            scene.style.height = '100%';

            // Assets
            const assets = document.createElement('a-assets');
            
            // Imagen para el plano (opcional)
            const cardImg = document.createElement('img');
            cardImg.id = 'card';
            cardImg.src = 'si.png';
            cardImg.crossOrigin = 'anonymous';
            assets.appendChild(cardImg);

            // Modelo 3D
            const avatarModel = document.createElement('a-asset-item');
            avatarModel.id = 'avatarModel';
            avatarModel.src = '3d/piramide.glb';
            avatarModel.crossOrigin = 'anonymous';
            
            // Eventos para debugging del modelo
            avatarModel.addEventListener('load', () => {
                console.log('✅ Modelo 3D cargado correctamente');
                this.updateStatus('Modelo cargado - Buscando objetivo...', 'normal');
            });

            avatarModel.addEventListener('error', (e) => {
                console.error('❌ Error cargando modelo 3D:', e);
                this.updateStatus('Error cargando modelo', 'error');
            });

            assets.appendChild(avatarModel);
            scene.appendChild(assets);

            // Cámara
            const camera = document.createElement('a-camera');
            camera.setAttribute('position', '0 0 0');
            camera.setAttribute('look-controls', 'enabled: false');
            camera.setAttribute('cursor', 'rayOrigin: mouse');
            scene.appendChild(camera);

            // Entidad objetivo
            const targetEntity = document.createElement('a-entity');
            targetEntity.setAttribute('mindar-image-target', 'targetIndex: 0');

            // Eventos del target para debugging
            targetEntity.addEventListener('targetFound', () => {
                console.log('🎯 Objetivo encontrado!');
                this.updateStatus('¡Objetivo detectado!', 'normal');
            });

            targetEntity.addEventListener('targetLost', () => {
                console.log('❌ Objetivo perdido');
                this.updateStatus('Objetivo perdido - Busca la imagen', 'loading');
            });

            // Plano de fondo (opcional)
            const plane = document.createElement('a-plane');
            plane.setAttribute('src', '#card');
            plane.setAttribute('position', '0 0 0');
            plane.setAttribute('height', '0.552');
            plane.setAttribute('width', '1');
            plane.setAttribute('rotation', '0 0 0');
            plane.setAttribute('opacity', '0.8');
            targetEntity.appendChild(plane);

            // Modelo 3D principal
            const model = document.createElement('a-gltf-model');
            model.setAttribute('rotation', '0 0 0');
            model.setAttribute('position', '0 0 0.15'); // Un poco más alto
            model.setAttribute('scale', '0.2 0.2 0.2'); // Escala más pequeña para debug
            model.setAttribute('src', '#avatarModel');
            
            // Animación
            model.setAttribute('animation', 
                'property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true'
            );
            
            // Segundo modelo con animación de posición
            const model2 = model.cloneNode(true);
            model2.setAttribute('position', '0 0 0.25');
            model2.setAttribute('scale', '0.15 0.15 0.15');
            model2.setAttribute('animation', 
                'property: position; to: 0 0.1 0.25; dur: 2000; easing: easeInOutQuad; loop: true; dir: alternate'
            );

            // Eventos del modelo para debugging
            model.addEventListener('model-loaded', () => {
                console.log('🎮 Modelo 3D renderizado en escena');
            });

            model.addEventListener('model-error', (e) => {
                console.error('❌ Error renderizando modelo:', e);
            });

            targetEntity.appendChild(model);
            targetEntity.appendChild(model2);
            scene.appendChild(targetEntity);

            // Agregar la escena al contenedor
            arContainer.appendChild(scene);

            // Configurar eventos de la escena
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

            // Evento específico de MindAR
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
});