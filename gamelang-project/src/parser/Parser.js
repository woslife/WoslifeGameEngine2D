// ============================================
// GAMELANG PARSER v4.1 - ФИНАЛЬНЫЙ ИСПРАВЛЕННЫЙ
// ============================================

class GamelangParser {
    constructor() {
        this.tokens = [];
        this.current = 0;
        this.currentLine = 0;
    }
    
    // ==================== ОСНОВНОЙ МЕТОД ====================
    
    parse(code) {
        console.log("🧠 Парсим Gamelang...");
        
        // 1. Подготовка: разбиваем на строки, удаляем комментарии
        const lines = this.prepareCode(code);
        
        // 2. Токенизация каждой строки
        this.tokens = this.tokenizeLines(lines);
        this.current = 0;
        
        // 3. Парсинг программы
        const statements = [];
        
        while (!this.isAtEnd()) {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    statements.push(stmt);
                }
            } catch (error) {
                console.error("❌ Ошибка парсинга:", error.message);
                this.synchronize();
            }
        }
        
        console.log("✅ Парсинг завершен. Инструкций:", statements.length);
        
        return {
            type: 'Program',
            body: statements,
            version: 'Gamelang 4.1'
        };
    }
    
    // ==================== ПОДГОТОВКА КОДА ====================
    
    prepareCode(code) {
        const lines = code.split('\n');
        const cleaned = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Удаляем комментарии
            const commentIndex = line.indexOf('#');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex);
            }
            
            line = line.trim();
            if (line) {
                cleaned.push({
                    text: line,
                    lineNum: i,
                    indent: this.getIndentLevel(lines[i])
                });
            }
        }
        
        return cleaned;
    }
    
    getIndentLevel(line) {
        let spaces = 0;
        for (let char of line) {
            if (char === ' ') spaces++;
            else if (char === '\t') spaces += 4;
            else break;
        }
        return Math.floor(spaces / 4);
    }
    
    // ==================== ТОКЕНИЗАЦИЯ ====================
    
    tokenizeLines(lines) {
        const allTokens = [];
        
        for (const line of lines) {
            this.currentLine = line.lineNum;
            const tokens = this.tokenizeLine(line.text, line.indent);
            allTokens.push(...tokens);
            allTokens.push({ type: 'NEWLINE', line: line.lineNum });
        }
        
        allTokens.push({ type: 'EOF' });
        return allTokens;
    }
    
    tokenizeLine(line, indent) {
        const tokens = [];
        
        // Добавляем отступ
        if (indent > 0) {
            tokens.push({ type: 'INDENT', value: indent, line: this.currentLine });
        }
        
        let i = 0;
        let current = '';
        
        while (i < line.length) {
            const char = line[i];
            
            // Строковые литералы
            if (char === '"' || char === "'") {
                if (current) {
                    tokens.push(this.createToken(current));
                    current = '';
                }
                
                const quote = char;
                let value = '';
                i++;
                
                while (i < line.length && line[i] !== quote) {
                    value += line[i];
                    i++;
                }
                
                if (i >= line.length) {
                    throw new Error(`Незакрытая строка на строке ${this.currentLine + 1}`);
                }
                
                tokens.push({ type: 'STRING', value: value, line: this.currentLine });
                i++;
                continue;
            }
            
            // Разделители
            if ('()=:.,+-*/<>!'.includes(char)) {
                if (current) {
                    tokens.push(this.createToken(current));
                    current = '';
                }
                
                // Проверяем операторы сравнения
                if (i + 1 < line.length) {
                    const twoChar = char + line[i + 1];
                    if (twoChar === '<=' || twoChar === '>=' || twoChar === '==') {
                        tokens.push({ type: 'COMPARISON', value: twoChar, line: this.currentLine });
                        i += 2;
                        continue;
                    }
                }
                
                // Проверяем составные операторы
                if (i + 1 < line.length) {
                    const twoChar = char + line[i + 1];
                    if (twoChar === '+=' || twoChar === '-=' || twoChar === '*=' || twoChar === '/=') {
                        tokens.push({ type: 'OPERATOR', value: twoChar, line: this.currentLine });
                        i += 2;
                        continue;
                    }
                }
                
                // Одинарные операторы
                tokens.push({ type: 'SYMBOL', value: char, line: this.currentLine });
                i++;
                continue;
            }
            
            // Пробелы
            if (char === ' ') {
                if (current) {
                    tokens.push(this.createToken(current));
                    current = '';
                }
                i++;
                continue;
            }
            
            // Все остальные символы
            current += char;
            i++;
        }
        
        // Последний токен в строке
        if (current) {
            tokens.push(this.createToken(current));
        }
        
        return tokens;
    }
    
    createToken(text) {
        // Ключевые слова
        const keywords = {
            'sprite': 'SPRITE',
            'background': 'BACKGROUND',
            'function': 'FUNCTION',
            'on': 'ON',
            'every': 'EVERY',
            'if': 'IF',
            'elif': 'ELIF',
            'else': 'ELSE',
            'print': 'PRINT',
            'say': 'SAY',
            'random': 'RANDOM',
            'true': 'BOOLEAN',
            'false': 'BOOLEAN'
        };
        
        if (keywords[text]) {
            return {
                type: keywords[text],
                value: text,
                line: this.currentLine
            };
        }
        
        // Числа
        if (/^\d+$/.test(text)) {
            return {
                type: 'NUMBER',
                value: parseInt(text),
                line: this.currentLine
            };
        }
        
        if (/^\d+\.\d+$/.test(text)) {
            return {
                type: 'NUMBER',
                value: parseFloat(text),
                line: this.currentLine
            };
        }
        
        // Идентификаторы
        return {
            type: 'IDENTIFIER',
            value: text,
            line: this.currentLine
        };
    }
    
    // ==================== ПАРСИНГ СТАТЕМЕНТОВ ====================
    
    parseStatement() {
        // Пропускаем INDENT
        if (this.check('INDENT')) {
            this.advance();
        }
        
        if (this.isAtEnd() || this.check('NEWLINE')) {
            if (this.check('NEWLINE')) this.advance();
            return null;
        }
        
        const token = this.peek();
        
        // Определяем тип statement
        switch (token.type) {
            case 'SPRITE':
                return this.parseSprite();
            case 'FUNCTION':
                return this.parseFunction();
            case 'PRINT':
                return this.parsePrint();
            case 'IF':
                return this.parseIf();
            case 'EVERY':
                return this.parseEvery();
            case 'ON':
                return this.parseOn();
            case 'BACKGROUND':
                return this.parseBackground();
            default:
                return this.parseExpressionOrAssignment();
        }
    }
    
    // ==================== ПАРСИНГ КОНСТРУКЦИЙ ====================
    
    parseSprite() {
        this.consume('SPRITE');
        const name = this.consume('IDENTIFIER').value;
        
        let image = '';
        if (this.check('STRING')) {
            image = this.consume('STRING').value;
        }
        
        return {
            type: 'SpriteDeclaration',
            name: name,
            image: image,
            line: this.currentLine
        };
    }
    
    parseBackground() {
        this.consume('BACKGROUND');
        const image = this.consume('STRING').value;
        
        return {
            type: 'BackgroundDeclaration',
            image: image,
            line: this.currentLine
        };
    }
    
    parseFunction() {
        const funcToken = this.consume('FUNCTION');
        const name = this.consume('IDENTIFIER').value;
        
        this.consume('SYMBOL', '(');
        
        // Параметры
        const params = [];
        if (!this.check('SYMBOL', ')')) {
            params.push(this.consume('IDENTIFIER').value);
            
            while (this.match('SYMBOL', ',')) {
                params.push(this.consume('IDENTIFIER').value);
            }
        }
        
        this.consume('SYMBOL', ')');
        this.consume('SYMBOL', ':');
        
        // Пропускаем NEWLINE
        this.match('NEWLINE');
        
        // Тело функции (все что с отступом)
        const body = [];
        while (!this.isAtEnd() && this.check('INDENT') && this.peek().value > 0) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        
        return {
            type: 'FunctionDeclaration',
            name: name,
            params: params,
            body: body,
            line: funcToken.line
        };
    }
    
    parsePrint() {
        const printToken = this.consume('PRINT');
        
        // Проверяем есть ли скобки
        if (this.check('SYMBOL', '(')) {
            this.consume('SYMBOL', '(');
        }
        
        // Аргументы print (могут быть сложными выражениями)
        const args = [];
        if (!this.check('SYMBOL', ')') && !this.check('NEWLINE')) {
            // Парсим выражение до закрывающей скобки или конца строки
            const arg = this.parseExpression();
            args.push(arg);
        }
        
        // Закрывающая скобка если была
        if (this.check('SYMBOL', ')')) {
            this.consume('SYMBOL', ')');
        }
        
        return {
            type: 'ExpressionStatement',
            expression: {
                type: 'FunctionCall',
                name: 'print',
                arguments: args
            },
            line: printToken.line
        };
    }
    
    parseIf() {
        const ifToken = this.consume('IF');
        const condition = this.parseExpression();
        
        // После условия должно быть ':'
        if (!this.check('SYMBOL', ':')) {
            // Если нет ':', пропускаем выражение до конца строки
            this.synchronize();
            return {
                type: 'ExpressionStatement',
                expression: condition,
                line: ifToken.line
            };
        }
        
        this.consume('SYMBOL', ':');
        this.consume('NEWLINE');
        
        // Тело if (все что с отступом)
        const body = [];
        while (!this.isAtEnd() && this.check('INDENT') && this.peek().value > 0) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        
        return {
            type: 'IfStatement',
            condition: condition,
            body: body,
            line: ifToken.line
        };
    }
    
    parseEvery() {
        this.consume('EVERY');
        const loopType = this.consume('IDENTIFIER').value;
        this.consume('SYMBOL', ':');
        this.consume('NEWLINE');
        
        // Тело every
        const body = [];
        while (!this.isAtEnd() && this.check('INDENT') && this.peek().value > 0) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        
        return {
            type: 'LoopDeclaration',
            loopType: loopType,
            body: body,
            line: this.currentLine
        };
    }
    
    parseOn() {
        this.consume('ON');
        const eventType = this.consume('IDENTIFIER').value;
        
        this.consume('SYMBOL', '(');
        
        // Аргументы события
        const args = [];
        if (!this.check('SYMBOL', ')')) {
            args.push(this.parseExpression());
            
            while (this.match('SYMBOL', ',')) {
                args.push(this.parseExpression());
            }
        }
        
        this.consume('SYMBOL', ')');
        this.consume('SYMBOL', ':');
        this.consume('NEWLINE');
        
        // Тело события
        const body = [];
        while (!this.isAtEnd() && this.check('INDENT') && this.peek().value > 0) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        
        return {
            type: 'EventDeclaration',
            eventType: eventType,
            args: args,
            body: body,
            line: this.currentLine
        };
    }
    
    // ==================== ВЫРАЖЕНИЯ И ПРИСВАИВАНИЯ ====================
    
    parseExpressionOrAssignment() {
        const startPos = this.current;
        
        try {
            // Пробуем распарсить присваивание свойства
            if (this.check('IDENTIFIER') && 
                this.peekAhead(1)?.type === 'SYMBOL' && 
                this.peekAhead(1)?.value === '.' &&
                this.peekAhead(2)?.type === 'IDENTIFIER') {
                
                const object = this.consume('IDENTIFIER').value;
                this.consume('SYMBOL', '.');
                const property = this.consume('IDENTIFIER').value;
                
                // Проверяем оператор присваивания
                if (this.check('OPERATOR') || this.check('SYMBOL', '=')) {
                    const operator = this.advance().value; // =, +=, -= и т.д.
                    const value = this.parseExpression();
                    
                    return {
                        type: 'PropertyAssignment',
                        object: object,
                        property: property,
                        operator: operator,
                        value: value,
                        line: this.currentLine
                    };
                } else {
                    // Просто доступ к свойству
                    return {
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'PropertyAccess',
                            object: object,
                            property: property
                        },
                        line: this.currentLine
                    };
                }
            }
            
            // Простое присваивание переменной
            if (this.check('IDENTIFIER') && 
                (this.peekAhead(1)?.type === 'SYMBOL' || this.peekAhead(1)?.type === 'OPERATOR') &&
                this.peekAhead(1)?.value === '=') {
                
                const name = this.consume('IDENTIFIER').value;
                this.advance(); // = или += и т.д.
                const value = this.parseExpression();
                
                return {
                    type: 'Assignment',
                    name: name,
                    value: value,
                    line: this.currentLine
                };
            }
            
            // Просто выражение
            const expr = this.parseExpression();
            return {
                type: 'ExpressionStatement',
                expression: expr,
                line: this.currentLine
            };
            
        } catch (error) {
            // Откатываемся и пробуем просто выражение
            this.current = startPos;
            const expr = this.parseExpression();
            return {
                type: 'ExpressionStatement',
                expression: expr,
                line: this.currentLine
            };
        }
    }
    
    // ==================== ПАРСИНГ ВЫРАЖЕНИЙ ====================
    
    parseExpression() {
        return this.parseComparison();
    }
    
    parseComparison() {
        let expr = this.parseAdditive();
        
        while (this.check('COMPARISON') || 
               this.check('SYMBOL', '<') || 
               this.check('SYMBOL', '>') ||
               this.check('SYMBOL', '=') && this.peekAhead(1)?.value === '=') {
            
            const operator = this.advance().value;
            const right = this.parseAdditive();
            
            expr = {
                type: 'BinaryExpression',
                operator: operator,
                left: expr,
                right: right,
                line: this.currentLine
            };
        }
        
        return expr;
    }
    
    parseAdditive() {
        let expr = this.parseMultiplicative();
        
        while (this.check('OPERATOR', '+=') || this.check('OPERATOR', '-=') || 
               this.check('SYMBOL', '+') || this.check('SYMBOL', '-')) {
            
            const operator = this.advance().value;
            const right = this.parseMultiplicative();
            
            expr = {
                type: 'BinaryExpression',
                operator: operator,
                left: expr,
                right: right,
                line: this.currentLine
            };
        }
        
        return expr;
    }
    
    parseMultiplicative() {
        let expr = this.parsePrimary();
        
        while (this.check('OPERATOR', '*=') || this.check('OPERATOR', '/=') ||
               this.check('SYMBOL', '*') || this.check('SYMBOL', '/')) {
            
            const operator = this.advance().value;
            const right = this.parsePrimary();
            
            expr = {
                type: 'BinaryExpression',
                operator: operator,
                left: expr,
                right: right,
                line: this.currentLine
            };
        }
        
        return expr;
    }
    
    parsePrimary() {
        // Начинаем с атомарного выражения
        let expr = this.parseAtom();
        
        // Обрабатываем цепочки доступа к свойствам: object.property.property
        while (this.check('SYMBOL', '.')) {
            this.consume('SYMBOL', '.');
            const property = this.consume('IDENTIFIER').value;
            
            expr = {
                type: 'PropertyAccess',
                object: expr,
                property: property,
                line: this.currentLine
            };
        }
        
        return expr;
    }
    
    parseAtom() {
        // Простые значения
        if (this.check('NUMBER')) {
            const token = this.consume('NUMBER');
            return {
                type: 'NumberLiteral',
                value: token.value,
                line: token.line
            };
        }
        
        if (this.check('STRING')) {
            const token = this.consume('STRING');
            return {
                type: 'StringLiteral',
                value: token.value,
                line: token.line
            };
        }
        
        if (this.check('BOOLEAN')) {
            const token = this.consume('BOOLEAN');
            return {
                type: 'BooleanLiteral',
                value: token.value === 'true',
                line: token.line
            };
        }
        
        if (this.check('IDENTIFIER')) {
            const token = this.consume('IDENTIFIER');
            
            // Проверяем, не вызов ли это функции
            if (this.check('SYMBOL', '(')) {
                this.consume('SYMBOL', '(');
                
                const args = [];
                if (!this.check('SYMBOL', ')')) {
                    args.push(this.parseExpression());
                    
                    while (this.match('SYMBOL', ',')) {
                        args.push(this.parseExpression());
                    }
                }
                
                this.consume('SYMBOL', ')');
                
                return {
                    type: 'FunctionCall',
                    name: token.value,
                    arguments: args,
                    line: token.line
                };
            }
            
            // Просто идентификатор
            return {
                type: 'Identifier',
                name: token.value,
                line: token.line
            };
        }
        
        // Скобки
        if (this.check('SYMBOL', '(')) {
            this.consume('SYMBOL', '(');
            const expr = this.parseExpression();
            this.consume('SYMBOL', ')');
            return expr;
        }
        
        throw new Error(`Неизвестное выражение: ${this.peek().type} "${this.peek().value}"`);
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================
    
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    
    check(type, value = null) {
        if (this.isAtEnd()) return false;
        const token = this.peek();
        
        if (value !== null) {
            return token.value === value;
        }
        
        return token.type === type;
    }
    
    consume(type, value = null) {
        if (this.check(type, value)) {
            return this.advance();
        }
        
        const token = this.peek();
        throw new Error(`Ожидается ${type}${value ? `="${value}"` : ''}, получен ${token.type}="${token.value}" на строке ${token.line + 1}`);
    }
    
    peekAhead(offset) {
        if (this.current + offset >= this.tokens.length) {
            return null;
        }
        return this.tokens[this.current + offset];
    }
    
    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }
    
    previous() {
        return this.tokens[this.current - 1];
    }
    
    peek() {
        return this.tokens[this.current];
    }
    
    isAtEnd() {
        return this.peek().type === 'EOF';
    }
    
    synchronize() {
        // Пропускаем токены до конца строки
        while (!this.isAtEnd() && !this.check('NEWLINE')) {
            this.advance();
        }
        
        if (this.check('NEWLINE')) {
            this.advance();
        }
    }
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = GamelangParser;
} else {
    window.GamelangParser = GamelangParser;
}