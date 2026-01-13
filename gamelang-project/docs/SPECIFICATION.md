# GAMELANG v1.0 - СПЕЦИФИКАЦИЯ

## БАЗОВЫЙ СИНТАКСИС:
- Отступы как в Python (4 пробела)
- Ключевые слова на английском
- Подсказки на русском

## ОСНОВНЫЕ КОМАНДЫ:
1. sprite name "image.png"      # Создать спрайт
2. function name():            # Объявить функцию  
3. on key_press("KEY"):        # Событие нажатия
4. every frame:               # Главный цикл
5. if condition:              # Условие

## ПРИМЕР ИГРЫ:
sprite player "hero.png"
player.x = 100
player.speed = 5

function jump(height):
    player.y -= height

on key_press("SPACE"):
    jump(15)

every frame:
    if key_down("RIGHT"):
        player.x += player.speed