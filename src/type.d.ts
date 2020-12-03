export interface IOptions{
  cache: boolean,
  base: string | HTMLCanvasElement,
  scale: number,
  speed: number,
  density: number,
  staggered: boolean,
  increaseSpeed: number,
  emoji: null | string,
  onStart?: Function,
  onEnded?: Function
}

export interface IWindowSize {
  width: number,
  height: number
}

export interface ISize {
  w: number,
  h: number, 
  x: number,
  y: number,
  scale: number,
  targetX: number
}