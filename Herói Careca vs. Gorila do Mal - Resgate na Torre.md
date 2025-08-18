# Herói Careca vs. Gorila do Mal - Resgate na Torre

Um jogo de plataforma 2D desenvolvido em HTML5 e JavaScript puro, sem frameworks externos.

## 🎮 Sobre o Jogo

Ajude o Herói Careca a resgatar a princesa na torre! Enfrente inimigos, colete chaves e use armas cômicas como bananas e pudins para derrotar o temível Gorila do Mal.

### Características:
- **Gênero**: Plataforma/Ação 2D
- **Duração**: 5-10 minutos (primeira jogada)
- **Plataformas**: Desktop e Mobile
- **Tecnologia**: HTML5 + CSS + JavaScript vanilla
- **Arte**: Pixel Art original
- **Som**: Efeitos sonoros e música de fundo

## 🚀 Como Executar

### Método 1: Arquivo Local
1. Baixe todos os arquivos do projeto
2. Abra o arquivo `index.html` em qualquer navegador moderno
3. O jogo funcionará 100% offline!

### Método 2: Servidor Local (Recomendado)
```bash
# Se você tem Python instalado:
python -m http.server 8000

# Ou se você tem Node.js:
npx serve .

# Depois acesse: http://localhost:8000
```

## 🎯 Controles

### Teclado (Desktop):
- **← → ou A D**: Mover o herói
- **Espaço**: Pular (duplo pulo disponível)
- **K**: Arremessar banana
- **L**: Arremessar pudim
- **P**: Pausar o jogo

### Touch (Mobile):
- Botões virtuais na tela para todos os controles
- Interface otimizada para dispositivos móveis

## 🎪 Mecânicas do Jogo

### Personagens:
- **Herói Careca**: Protagonista corajoso com bigode e macacão
- **Gorila do Mal**: Chefão final na torre
- **Princesa**: Aguarda resgate no topo da torre

### Armas:
- **🍌 Bananas**: Munição infinita, trajetória em arco
- **🍮 Pudim**: Munição limitada, cria área escorregadia

### Sistema de Vida:
- 3 corações de vida
- Invencibilidade temporária após dano
- Game over ao perder todas as vidas

### Coletáveis:
- **Chaves/Moedas**: Pontuação e progressão
- **Power-ups**: Melhorias temporárias
- **Pudins extras**: Recarrega munição especial

## 🏗️ Estrutura do Projeto

```
heroi-careca-game/
├── index.html              # Arquivo principal
├── css/
│   └── style.css          # Estilos responsivos
├── js/
│   └── game.js           # Lógica do jogo
├── assets/
│   ├── img/              # Sprites e imagens
│   ├── sfx/              # Efeitos sonoros
│   └── maps/             # Dados das fases
├── manifest.webmanifest   # PWA manifest
├── sw.js                 # Service Worker
└── README.md             # Este arquivo
```

## 🎨 Fases do Jogo

1. **Fase 1**: Floresta - Tutorial básico
2. **Fase 2**: Montanha - Dificuldade média
3. **Fase 3**: Torre - Desafio final
4. **Chefão**: Gorila do Mal - Batalha épica

## ⚙️ Configurações

O jogo inclui opções de acessibilidade:
- **Reduzir movimento**: Desabilita animações excessivas
- **Alto contraste**: Melhora visibilidade
- **Controle de volume**: Ajuste de áudio

## 🌐 PWA (Progressive Web App)

O jogo funciona como uma PWA, permitindo:
- Instalação no dispositivo
- Funcionamento offline
- Ícone na tela inicial
- Experiência similar a app nativo

## 🔧 Requisitos Técnicos

- **Navegador**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **JavaScript**: ES6+ habilitado
- **Canvas**: Suporte a HTML5 Canvas
- **Audio**: Suporte a Web Audio API (opcional)

## 🎵 Recursos de Áudio

- Efeitos sonoros para ações (pulo, tiro, coleta)
- Música de fundo ambiente
- Controle de volume integrado
- Fallback silencioso se áudio não disponível

## 🐛 Solução de Problemas

### Jogo não carrega:
- Verifique se JavaScript está habilitado
- Teste em navegador diferente
- Limpe cache do navegador

### Controles não respondem:
- Clique na área do jogo para dar foco
- Verifique se não há outros elementos capturando eventos

### Performance baixa:
- Feche outras abas do navegador
- Reduza zoom da página
- Ative "Reduzir movimento" nas configurações

## 📱 Compatibilidade Mobile

- Interface touch otimizada
- Botões virtuais responsivos
- Suporte a orientação landscape/portrait
- Prevenção de zoom acidental
- Feedback visual de toque

## 🏆 Pontuação

- **Inimigos derrotados**: 100 pontos cada
- **Chaves coletadas**: 50 pontos cada
- **Conclusão de fase**: 500 pontos
- **Tempo restante**: Bônus variável
- **Vidas restantes**: 1000 pontos cada

## 🎯 Dicas de Jogo

1. Use bananas para ataques à distância
2. Economize pudins para momentos difíceis
3. Áreas escorregadias afetam você também!
4. Duplo pulo é essencial para plataformas altas
5. Colete todas as chaves para máxima pontuação

## 📄 Licença

Este projeto é de código aberto para fins educacionais e de demonstração.

## 👥 Créditos

- **Desenvolvimento**: Manus.ia
- **Arte**: Pixel Art original
- **Música**: Trilha sonora original
- **Tecnologia**: HTML5 + JavaScript

---

**Divirta-se jogando! 🎮**

