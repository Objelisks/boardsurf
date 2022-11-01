import {rotate90, rotate180, rotate270} from '@pelevesque/matrix-transformers'

/*
grids = [
  [0, 0, 1, 2, 3, ...],
  [0, 0, 1, 0, 0, ...],
  [0, 0, 1, 0, 7, ...],
  ...
]

values:
  0 - blank
  1 - local normal
  2 - local special
  3 - local special activated
  4 - opponent normal
  5 - opponent special
  6 - opponent special activated
  7 - locked wall
  8 - map out of bounds space (based on shape of map)
*/

/*

card = {
  grid: [[], [], ...],
  name: string,
  special: number // special cost
}

values:
  0 - empty
  1 - regular space
  2 - special space

*/

const lockedWall = 7

export const TEAMS = {
  local: 0,
  opponent: 1
}

// number of turns to rotate a 2d matrix
const ROTATIONS = {
  0: (grid) => grid,
  1: rotate90,
  2: rotate180,
  3: rotate270
}

// makes an empty grid
export const createGrid = (width=8, height=8) => {
  return new Array(height).fill(0).map(() => new Array(width).fill(0))
}

export const rotateGrid = (grid, turns) => {
  const rotates = ((turns%4) + 4) % 4
  return ROTATIONS[rotates](grid)
}

export const countFilled = (grid) => {
  return grid.reduce((acc, row) =>
    acc + row.reduce((acc, space) =>
      acc + (space > 0 ? 1 : 0),
    0),
  0)
}

const isOffMap = (grid, x, y) => {
  if(x < 0 || x >= grid[0].length) return true
  if(y < 0 || y >= grid.length) return true
  if([8].includes(grid[y][x])) return true
  return false
}

export const isSpecial = (space) => {
  return [2, 3, 5, 6].includes(space)
}

export const isOwned = (space, team=TEAMS.local) => {
  return [1+3*team, 2+3*team, 3+3*team].includes(space)
}

const isEmpty = (space) => {
  return space === 0
}

export const isWall = (space) => {
  return space === 7
}

const isSameTier = (valueA, valueB) => {
  return ([1, 4].includes(valueA) && [1, 4].includes(valueB)) || 
        ([2, 5].includes(valueA) && [2, 5].includes(valueB))
}

// 0, 1, 2 => 12, 45
const teamSpace = (space, team) => {
  return space + (team === TEAMS.local ? 0 : 3)
}

const getSpaces = (grid) => {
  return grid.flatMap((row, y) =>
    row.flatMap((space, x) =>
      ({x: x, y: y, value: space})))
}

const getPlayedSpaces = (play) => {
  const grid = rotateGrid(play.card.grid, play.turns)
  return grid.flatMap((row, y) =>
    row.flatMap((space, x) =>
      ({x: x+play.x, y: y+play.y, value: teamSpace(space, play.team), special: play.special})))
}

// converts a play to a grid
// play: {action: ACTIONS, card: 'splattershot', x, y, turns, special}
export const playToGrid = (play, gridWidth, gridHeight) => {
  const newGrid = createGrid(gridWidth, gridHeight)
  getPlayedSpaces(play).forEach(space => {
    if(isOffMap(newGrid, space.x, space.y)) {
      console.log('played off grid', space.x, space.y)
      return
    }
    newGrid[space.y][space.x] = space.value
  })
  return newGrid
}

/*
note: there is never a case where the existing tiles overwrite the placement tiles

we need to combine in the case of both using special and overlap,
some tiles turn into walls, which overwrite existing tiles,
and it would be ambiguous to just play one first and then the other
*/

// given two plays (assuming equal priority), any overlaps should be returned
export const getWalls = (grid1, grid2) => {
  const spaces1 = getSpaces(grid1).filter(space1 => space1.value !== 0)
  const spaces2 = getSpaces(grid2).filter(space2 => space2.value !== 0)
  return spaces1
    .filter(space1 => {
      const match = spaces2.find(space2 => space1.x === space2.x && space1.y === space2.y)
      return match && isSameTier(match.value, space1.value)
    }) // find matches
    .map((space1) => ({x: space1.x, y: space1.y, value: lockedWall}))
}


// combines two grids, assuming they're the same size
// uses game logic rules to combine overlapping tiles
export const combineGrids = (grid1, grid2) => {
  let newGrid = createGrid(grid1[0].length, grid1.length)
  const walls = getWalls(grid1, grid2)
  newGrid = placeGrid(newGrid, grid1)
  newGrid = placeGrid(newGrid, grid2)
  walls.forEach(wall => {
    newGrid[wall.y][wall.x] = lockedWall
  })
  return newGrid
}

// overwrites a grid with another grid (maybe offset)
export const placeGrid = (grid1, grid2, x=0, y=0) => {
  const newGrid = createGrid(grid1[0].length, grid1.length)
  getSpaces(grid1).forEach(space => {
    newGrid[space.y][space.x] = space.value
  })
  getSpaces(grid2).forEach(space => {
    if(isEmpty(space.value)) return
    if(isOffMap(newGrid, space.x+x, space.y+y)) {
      console.log('placed off grid', space.x, space.y)
      return
    }
    newGrid[space.y+y][space.x+x] = space.value
  })
  return newGrid
}

const PROBLEMS = {
  off: 'Placement is off the target board',
  conflict: 'Placement is over a locked square',
  conflictSpecial: 'Special placement is over a special square',
  far: 'Placement is not next to an owned square',
  farSpecial: 'Special placement is not next to a special square',
  wallConflict: 'Special placement is over a wall'
}

const checkNeighbors = (grid, x, y, team, check) => {
  let atLeastOne = false
  for(let i=-1; i<=1; i++) {
    for(let j=-1; j<=1; j++) {
      if(isOffMap(grid, x+i, y+j)) continue
      if(i === 0 && j === 0) continue
      if(check(grid[y+j][x+i], team)) {
        atLeastOne = true
      }
    }
  }
  return atLeastOne
}

const hasOwnedNeighbor = (grid, x, y, team) => {
  return checkNeighbors(grid, x, y, team, isOwned)
}

const hasSpecialNeighbor = (grid, x, y, team) => {
  return checkNeighbors(grid, x, y, team, (space, team) => isOwned(space, team) && isSpecial(space))
}

// board x card
// false if no PROBLEMS to placement
export const placementProblemTest = (grid, cardGrid, offsetX, offsetY, special) => {
  const spaces = getSpaces(cardGrid)
  let nextToOwned = false
  let nextToSpecial = false
  for(const {x: spaceX, y: spaceY, value: space} of spaces) {
    const x = spaceX + offsetX
    const y = spaceY + offsetY

    if(isEmpty(space)) continue

    // can never place on these spaces
    if(isOffMap(grid, x, y)) return PROBLEMS.off
    if(isWall(grid[y][x])) return PROBLEMS.wallConflict

    if(special) {
      // if we're using the special boost, any space can overlap any other non-special space
      // but we must be next to a special space
      if(isSpecial(grid[y][x])) {
        return PROBLEMS.conflictSpecial
      }
      if(hasSpecialNeighbor(grid, x, y, TEAMS.local)) {
        nextToSpecial = true
      }
    } else {
      // if we're not using special, we can only overlap empty spaces
      // and must be next to an owned space
      if(!isEmpty(grid[y][x])) {
        return PROBLEMS.conflict
      }
      if(hasOwnedNeighbor(grid, x, y, TEAMS.local)) {
        nextToOwned = true
      }
    }
  }
  if(special && !nextToSpecial) {
    return PROBLEMS.farSpecial
  } else if(!special && !nextToOwned) {
    return PROBLEMS.far
  }
  return false
}