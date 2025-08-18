/**
 * Service Worker para Herói Careca vs. Gorila do Mal
 * Permite funcionamento offline e cache de recursos
 */

const CACHE_NAME = 'heroi-careca-v1.0.0';
const CACHE_URLS = [
    './',
    './index.html',
    './css/style.css',
    './js/game.js',
    './assets/img/hero_idle.png',
    './assets/img/hero_walk1.png',
    './assets/img/hero_walk2.png',
    './assets/img/hero_jump.png',
    './assets/img/gorilla_idle.png',
    './assets/img/princess.png',
    './assets/img/banana.png',
    './assets/img/pudding.png',
    './assets/img/platform.png',
    './assets/img/coin.png',
    './assets/img/key.png',
    './assets/img/tower.png',
    './assets/img/background_sky.png',
    './assets/img/favicon.png',
    './manifest.webmanifest'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache aberto');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: Todos os recursos foram cacheados');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Erro ao cachear recursos:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Ativando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Ativado');
                return self.clients.claim();
            })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    // Ignorar requisições que não são GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Ignorar requisições para outros domínios
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Se encontrou no cache, retorna
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Senão, busca na rede
                return fetch(event.request)
                    .then((response) => {
                        // Verifica se a resposta é válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clona a resposta para cachear
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Se falhar, retorna página offline se for uma navegação
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Sincronização em background (opcional)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Sincronização em background');
        // Implementar sincronização de dados se necessário
    }
});

// Notificações push (opcional)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: './assets/img/favicon.png',
            badge: './assets/img/favicon.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Jogar Agora',
                    icon: './assets/img/favicon.png'
                },
                {
                    action: 'close',
                    title: 'Fechar',
                    icon: './assets/img/favicon.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

console.log('Service Worker: Script carregado');

