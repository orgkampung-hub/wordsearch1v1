export function generateGrid(size, allWords) {
    const selectedWords = [...allWords]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10)
        .map(w => w.toUpperCase());

    let bestGrid = null;
    let maxCrosses = -1;

    for (let attempt = 0; attempt < 5000; attempt++) {
        let grid = Array(size).fill(null).map(() => Array(size).fill(''));
        let currentCrosses = 0;
        let placedCount = 0;
        let diagonalCount = 0;

        for (const word of selectedWords) {
            const directions = [
                [0, 1], [1, 0], [1, 1], [1, -1],
                [0, -1], [-1, 0], [-1, -1], [-1, 1]
            ];
            
            for (let i = 0; i < 100; i++) {
                const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
                const r = Math.floor(Math.random() * size);
                const c = Math.floor(Math.random() * size);
                const endR = r + dr * (word.length - 1);
                const endC = c + dc * (word.length - 1);

                if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

                let canPlace = true;
                let overlapCount = 0;

                for (let j = 0; j < word.length; j++) {
                    const currR = r + dr * j;
                    const currC = c + dc * j;
                    if (grid[currR][currC] !== '' && grid[currR][currC] !== word[j]) {
                        canPlace = false;
                        break;
                    }
                    if (grid[currR][currC] === word[j]) overlapCount++;
                }

                if (canPlace) {
                    for (let j = 0; j < word.length; j++) {
                        grid[r + dr * j][c + dc * j] = word[j];
                    }
                    currentCrosses += overlapCount;
                    placedCount++;
                    if (dr !== 0 && dc !== 0) diagonalCount++;
                    break;
                }
            }
        }

        if (placedCount === 10 && diagonalCount >= 1) {
            if (currentCrosses > maxCrosses) {
                maxCrosses = currentCrosses;
                bestGrid = JSON.parse(JSON.stringify(grid));
            }
            if (maxCrosses > 8) break; 
        }
    }

    const finalGrid = bestGrid || Array(size).fill(null).map(() => 
        Array(size).fill('').map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    );

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (finalGrid[r][c] === '') {
                finalGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }

    return { grid: finalGrid, words: selectedWords };
}
