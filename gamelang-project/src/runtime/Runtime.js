// ============================================
// GAMELANG RUNTIME v2.0 - ПОЛНЫЙ КОД
// ============================================

class GamelangRuntime {
    constructor() {
        this.context = new GameContext();
        this.ast = null;
        this.isExecuting = false;
    }
    
    // ==================== ОСНОВНЫЕ МЕТОДЫ ====================
    
    execute(ast) {
        console.log("🚀 Запуск Gamelang Runtime...");
        
        this.ast = ast;
        this.isExecuting = true;
        this.context.clearOutput();
        
        try {
            // 1. Регистрируем все объявления
            this.registerDeclarations(ast.body);
            
            // 2. Выполняем основной код
            this.executeStatements(ast.body);
            
            // 3. Запускаем игровой цикл, если есть
            this.startGameLoop();
            
            console.log("✅ Выполнение завершено успешно");
            console.log("📊 Состояние:", this.context.getState());
            
        } catch (error) {
            console.error("❌ Ошибка выполнения:", error);
            this.context.errors.push(error.message);
        }
        
        return this.context;
    }
    
    stop() {
        this.isExecuting = false;
        this.context.isRunning = false;
        console.log("⏹️ Runtime остановлен");
    }
    
    // ==================== РЕГИСТРАЦИЯ ====================
    
    registerDeclarations(statements) {
        statements.forEach(stmt => {
            switch (stmt.type) {
                case 'SpriteDeclaration':
                    this.registerSprite(stmt);
                    break;
                    
                case 'FunctionDeclaration':
                    this.registerFunction(stmt);
                    break;
                    
                case 'EventDeclaration':
                    this.registerEvent(stmt);
                    break;
                    
                case 'LoopDeclaration':
                    this.registerLoop(stmt);
                    break;
            }
        });
    }
    
    registerSprite(stmt) {
        this.context.createSprite(stmt.name, stmt.image);
    }
    
    registerFunction(stmt) {
        this.context.createFunction(stmt.name, stmt.params, stmt.body);
    }
    
    registerEvent(stmt) {
        this.context.events.set(stmt.eventType, stmt);
        console.log(`🎯 Зарегистрировано событие: ${stmt.eventType}`);
    }
    
    registerLoop(stmt) {
        this.context.events.set(stmt.loopType, stmt);
        console.log(`🔄 Зарегистрирован цикл: ${stmt.loopType}`);
    }
    
    // ==================== ВЫПОЛНЕНИЕ ====================
    
    executeStatements(statements) {
        statements.forEach(stmt => {
            if (!this.isExecuting) return;
            
            try {
                this.executeStatement(stmt);
            } catch (error) {
                console.error(`❌ Ошибка в statement ${stmt.type}:`, error);
            }
        });
    }
    
    executeStatement(stmt) {
        console.log(`▶️ Выполняем: ${stmt.type}`);
        
        switch (stmt.type) {
            case 'SpriteDeclaration':
            case 'FunctionDeclaration':
            case 'EventDeclaration':
            case 'LoopDeclaration':
                // Уже зарегистрированы
                break;
                
            case 'PropertyAssignment':
                this.executePropertyAssignment(stmt);
                break;
                
            case 'Assignment':
                this.executeAssignment(stmt);
                break;
                
            case 'ExpressionStatement':
                this.executeExpressionStatement(stmt);
                break;
                
            case 'IfStatement':
                this.executeIfStatement(stmt);
                break;
                
            default:
                console.warn(`⚠️ Неподдерживаемый statement: ${stmt.type}`);
        }
    }
    
    executePropertyAssignment(stmt) {
        const value = this.evaluateExpression(stmt.value);
        
        // Обрабатываем составные операторы
        if (stmt.operator) {
            const current = this.context.getSpriteProperty(stmt.object, stmt.property) || 0;
            let finalValue = value;
            
            switch (stmt.operator) {
                case '+=':
                    finalValue = current + value;
                    break;
                case '-=':
                    finalValue = current - value;
                    break;
                case '*=':
                    finalValue = current * value;
                    break;
                case '/=':
                    finalValue = current / value;
                    break;
                // '=' обрабатывается как обычно
            }
            
            this.context.setSpriteProperty(stmt.object, stmt.property, finalValue);
        } else {
            // Простое присваивание
            this.context.setSpriteProperty(stmt.object, stmt.property, value);
        }
    }
    
    executeAssignment(stmt) {
        const value = this.evaluateExpression(stmt.value);
        this.context.setVariable(stmt.name, value);
    }
    
    executeExpressionStatement(stmt) {
        return this.evaluateExpression(stmt.expression);
    }
    
    executeIfStatement(stmt) {
        const condition = this.evaluateExpression(stmt.condition);
        
        if (condition) {
            this.executeStatements(stmt.body);
        }
    }
    
    // ==================== ВЫЧИСЛЕНИЕ ВЫРАЖЕНИЙ ====================
    
    evaluateExpression(expr) {
        console.log(`🧮 Вычисляем: ${expr.type}`, expr);
        
        switch (expr.type) {
            case 'NumberLiteral':
                return expr.value;
                
            case 'StringLiteral':
                return expr.value;
                
            case 'BooleanLiteral':
                return expr.value;
                
            case 'Identifier':
                return this.context.getVariable(expr.name);
                
            case 'PropertyAccess':
                const obj = this.context.getVariable(expr.object);
                if (obj && typeof obj === 'object') {
                    return obj[expr.property];
                }
                return undefined;
                
            case 'FunctionCall':
                return this.executeFunctionCall(expr);
                
            case 'BinaryExpression':
                const left = this.evaluateExpression(expr.left);
                const right = this.evaluateExpression(expr.right);
                
                switch (expr.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                    case '+=': return left + right;
                    case '-=': return left - right;
                    case '*=': return left * right;
                    case '/=': return left / right;
                    default:
                        console.warn(`⚠️ Неподдерживаемый оператор: ${expr.operator}`);
                        return null;
                }
                
            default:
                console.warn(`⚠️ Неподдерживаемое выражение: ${expr.type}`);
                return null;
        }
    }
    
    // ==================== ФУНКЦИИ ====================
    
    executeFunctionCall(expr) {
        // Проверяем встроенные функции
        const builtinFunc = this.context.functions.get(expr.name);
        if (builtinFunc && !builtinFunc.isUserFunction) {
            const args = expr.arguments.map(arg => this.evaluateExpression(arg));
            return builtinFunc(...args);
        }
        
        // Проверяем пользовательские функции
        const userFunc = this.context.functions.get(expr.name);
        if (userFunc && userFunc.isUserFunction) {
            return this.executeUserFunction(userFunc, expr.arguments);
        }
        
        console.error(`❌ Функция не найдена: ${expr.name}`);
        return null;
    }
    
    executeUserFunction(func, argsAST) {
        console.log(`📞 Вызываем пользовательскую функцию: ${func.name}`);
        
        // Вычисляем аргументы
        const args = argsAST.map(arg => this.evaluateExpression(arg));
        
        // Сохраняем старые значения параметров
        const oldValues = {};
        func.params.forEach((param, index) => {
            oldValues[param] = this.context.getVariable(param);
            this.context.setVariable(param, args[index] || null);
        });
        
        // Выполняем тело функции
        let result = null;
        this.executeStatements(func.body);
        
        // Восстанавливаем значения
        func.params.forEach(param => {
            if (oldValues[param] !== undefined) {
                this.context.setVariable(param, oldValues[param]);
            } else {
                this.context.variables.delete(param);
            }
        });
        
        return result;
    }
    
    // ==================== ИГРОВОЙ ЦИКЛ ====================
    
    startGameLoop() {
        const frameEvent = this.context.events.get('frame');
        if (!frameEvent) {
            console.log("ℹ️ Нет every frame, игровой цикл не запущен");
            return;
        }
        
        console.log("🎮 Запускаем игровой цикл...");
        this.context.isRunning = true;
        
        const gameLoop = (timestamp) => {
            if (!this.context.isRunning || !this.isExecuting) return;
            
            // Вычисляем FPS
            if (this.context.lastFrameTime) {
                const delta = timestamp - this.context.lastFrameTime;
                this.context.fps = Math.round(1000 / delta);
            }
            this.context.lastFrameTime = timestamp;
            
            // Выполняем код кадра
            this.context.frameCount++;
            this.executeStatements(frameEvent.body);
            
            // Следующий кадр
            if (this.context.isRunning) {
                requestAnimationFrame(gameLoop);
            }
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    // ==================== УТИЛИТЫ ====================
    
    getOutput() {
        return this.context.getOutput();
    }
    
    getState() {
        return this.context.getState();
    }
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = GamelangRuntime;
} else {
    window.GamelangRuntime = GamelangRuntime;
}