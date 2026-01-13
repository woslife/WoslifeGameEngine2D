// ============================================
// GAMECONTEXT - КОНТЕКСТ ВЫПОЛНЕНИЯ ИГРЫ
// ============================================

class GameContext {
    constructor() {
        // Глобальные переменные
        this.variables = new Map();
        
        // Спрайты
        this.sprites = new Map();
        
        // Функции
        this.functions = new Map();
        
        // События
        this.events = new Map();
        
        // Состояние игры
        this.isRunning = false;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fps = 60;
        
        // Системные
        this.output = [];
        this.errors = [];
        
        // Встроенные функции (простые)
        this.setupBuiltins();
    }
    
    setupBuiltins() {
        // Встроенные функции
        this.functions.set('print', (message) => {
            const output = `[Gamelang]: ${message}`;
            this.output.push(output);
            console.log(output);
            return message;
        });
        
        this.functions.set('say', (message) => {
            alert(`Gamelang: ${message}`);
            return message;
        });
        
        this.functions.set('random', (min, max) => {
            return Math.random() * (max - min) + min;
        });
        
        // Системные переменные
        this.variables.set('true', true);
        this.variables.set('false', false);
        this.variables.set('null', null);
    }
    
    // ==================== УПРАВЛЕНИЕ ПЕРЕМЕННЫМИ ====================
    
    setVariable(name, value) {
        this.variables.set(name, value);
        console.log(`📝 Установлена переменная: ${name} = ${value}`);
    }
    
    getVariable(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        
        // Проверяем спрайты
        if (this.sprites.has(name)) {
            return this.sprites.get(name);
        }
        
        // Проверяем функции
        if (this.functions.has(name)) {
            return this.functions.get(name);
        }
        
        console.warn(`⚠️ Переменная не найдена: ${name}`);
        return undefined;
    }
    
    // ==================== УПРАВЛЕНИЕ СПРАЙТАМИ ====================
    
    createSprite(name, image = '') {
        const sprite = {
            name: name,
            image: image,
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            visible: true,
            properties: {}
        };
        
        this.sprites.set(name, sprite);
        console.log(`🎨 Создан спрайт: ${name} (${image || 'без изображения'})`);
        return sprite;
    }
    
    setSpriteProperty(spriteName, property, value) {
        const sprite = this.sprites.get(spriteName);
        if (!sprite) {
            console.error(`❌ Спрайт не найден: ${spriteName}`);
            return;
        }
        
        sprite[property] = value;
        console.log(`📝 ${spriteName}.${property} = ${value}`);
    }
    
    getSpriteProperty(spriteName, property) {
        const sprite = this.sprites.get(spriteName);
        if (!sprite) {
            console.error(`❌ Спрайт не найден: ${spriteName}`);
            return undefined;
        }
        
        return sprite[property];
    }
    
    // ==================== УПРАВЛЕНИЕ ФУНКЦИЯМИ ====================
    
    createFunction(name, params, body) {
        const func = {
            name: name,
            params: params,
            body: body,
            isUserFunction: true
        };
        
        this.functions.set(name, func);
        console.log(`📦 Создана функция: ${name}(${params.join(', ')})`);
        return func;
    }
    
    // ==================== СИСТЕМНЫЕ МЕТОДЫ ====================
    
    clearOutput() {
        this.output = [];
    }
    
    getOutput() {
        return this.output.join('\n');
    }
    
    getState() {
        return {
            variables: Object.fromEntries(this.variables),
            sprites: Object.fromEntries(this.sprites),
            functions: Array.from(this.functions.keys()),
            frameCount: this.frameCount,
            isRunning: this.isRunning
        };
    }
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = GameContext;
} else {
    window.GameContext = GameContext;
}