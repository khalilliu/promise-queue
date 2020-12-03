import {DEFAULT_OPTIONS} from "./constant"
import {IOptions, IWindowSize, ISize} from "./type"

class EmojiRain {
  
  private options: IOptions;
  // @ts-ignore
  private canvas: HTMLCanvasElement;
  // @ts-ignore
  private ctx: CanvasRenderingContext2D;
  // @ts-ignore
  private cacheCanvas: HTMLCanvasElement;
  // @ts-ignore
  private cacheCanvasCtx: CanvasRenderingContext2D;
  // @ts-ignore
  private _speed: IOptions['speed'];
  // @ts-ignore
  private ratio: number;
  // @ts-ignore
  private emojis: ISize[];
  // @ts-ignore
  private emojiImage: HTMLImageElement;
  // @ts-ignore  
  private hasLauched: boolean;
  // @ts-ignore
  private repeater: number ;

  constructor(options: Partial<IOptions>) {
    this.emojis = []
    this.options = {...DEFAULT_OPTIONS, ...options}
    this._speed = this.options.speed;
    this.init()
  }

  // load image url
  preloadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      if(img.complete) {
        resolve(img);
        return
      }
      img.onload = () => {
        resolve(img)
      }
      img.onerror = () => {
        reject(img)
      }
    })
  }

  // update options
  public update(options: Partial<IOptions>){
    if(options) {
      this.options = {
        ...this.options,
        ...options
      }
    }
  }

  get windowSize(): IWindowSize {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    }
  }

  static getPixelRadio():number {
    return (
     window.devicePixelRatio || 1
    )
  }

  static rand(num: number): number {
    return Math.floor(Math.random() * num + 1)
  }

  createCacheCanvas(){
    this.cacheCanvas = document.createElement('canvas');
    this.cacheCanvas.width = this.canvas.width;
    this.cacheCanvas.height = this.canvas.height;
    this.cacheCanvasCtx = this.cacheCanvas.getContext('2d') as CanvasRenderingContext2D
  }

  createEmojis():Promise<any> {
    // 数量 = canvasSize / imageSize * dentity
    if(!this.options.emoji) {
      return Promise.reject(new Error('emoji图片不能为空'))
    }
    return this.preloadImage(this.options.emoji).then(emoji => {
      this.emojiImage = emoji;
      let canvasWidth = parseInt(this.canvas!.style.width)
      let count = (canvasWidth / emoji.width / this.options.scale) * this.options.density;
      for(let i = 0; i < count; i++) {
        let emojiX = (canvasWidth/count) * i * this.ratio; 
        let emojiY = -EmojiRain.rand(this.canvas!.height);
        if(this.options.staggered){
          emojiX = emojiX * Math.random() * 2
        }
        let emojiSizeRandom = EmojiRain.rand(6) / 10; 
        emojiSizeRandom = emojiSizeRandom < 0.5 ? 0.8 : emojiSizeRandom 
        const newEmoji: ISize = {
          x: Math.trunc(0.5 + emojiX),
          y: Math.trunc(0.5 + emojiY),
          w: Math.trunc(0.5 + emoji.width * emojiSizeRandom),
          h: Math.trunc(0.5 + emoji.height * emojiSizeRandom),
          scale: this.options.scale,
          targetX: 0
        }
        // 生成交错效果
        if(this.options.staggered) {
          let targetX = 0;
          const fullWidth = this.canvas!.width
          const xLeft = fullWidth/3; // 左边界
          const xRight = fullWidth/3*2; // 右边界
          if(emojiX < xLeft) {
            targetX  = emojiX + (fullWidth * 1.2 * Math.random())
          } else if(emojiX > xRight) {
            targetX = emojiX - (fullWidth * 1.2 * Math.random())
          } else {
            let random = Math.random()
            targetX = random < 0.5 ? xLeft * random : fullWidth * Math.random()  
          }
          newEmoji.targetX = Math.trunc(0.5 + targetX)
        }
        this.emojis.push(newEmoji)
      }
    })
  }
  
  drawStep() {
    this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height)
    let nextGoOn = false
    let targetY = this.canvas!.height;
    this._speed += this.options.increaseSpeed;
    this.cacheCanvasCtx.clearRect(0, 0, this.canvas!.width, this.canvas!.height)
    for(let i=0; i<this.emojis.length; i++ ) {
      const emoji = this.emojis[i]
      const xSpeed = this._speed * 0.6;
      if(emoji.y < targetY) {
        // move
        if(this.options.staggered) {
          // 交错
          if(emoji.x < emoji.targetX ) {
            if(emoji.targetX - emoji.x < xSpeed) {
              emoji.x = emoji.targetX
            } else {
              emoji.x += xSpeed
            }
          } else {
            if(emoji.x - emoji.targetX < xSpeed) {
              emoji.x = emoji.targetX
            } else {
              emoji.x -= xSpeed
            }
          }
        }
        emoji.y += this._speed
        if(this.options.cache) {
          this.cacheCanvasCtx.drawImage(this.emojiImage, Math.trunc(0.5 + emoji.x), Math.trunc(0.5 + emoji.y), Math.trunc(0.5 + emoji.w * emoji.scale), Math.trunc(0.5 + emoji.h * emoji.scale))
        } else {
          this.ctx.drawImage(this.emojiImage, Math.trunc(0.5 + emoji.x), Math.trunc(0.5 + emoji.y), Math.trunc(0.5 + emoji.w * emoji.scale), Math.trunc(0.5 + emoji.h * emoji.scale) )
        }
        nextGoOn = true
      } else {
        this.emojis.splice(i,1)
      }
    }

    if(nextGoOn) {
      if(this.options.cache) {
        this.ctx.drawImage(this.cacheCanvas, 0, 0, this.canvas!.width, this.canvas!.height)
      }
    } else {
      this.hasLauched = false
      window.cancelAnimationFrame(this.repeater)
      if(this.options.onEnded) {
        this.options.onEnded()
      }
    }

  }

  _launch(){
    this.hasLauched = true
    this.repeater = window.requestAnimationFrame(this._launch.bind(this))
    this.drawStep()
  }

  public launch(): any {
    if(this.hasLauched) {
      return 
    }
    this.createEmojis().then(() => {
      if(this.options.onStart) {
        this.options.onStart()
      }
      this._speed = this.options.speed
      this._launch()
    })
  }

   // start animation
  init(): void{
    const options = this.options;
    this.canvas =<HTMLCanvasElement>(typeof options.base === 'string' ? document.querySelector(options.base) : options.base);
    this.canvas.width = this.canvas.width || this.windowSize.width
    this.canvas.height = this.canvas.height || this.windowSize.height
    this.ctx = <CanvasRenderingContext2D>(this.canvas!.getContext('2d'))
    // solve hdpi rendering problem
    const ratio = EmojiRain.getPixelRadio()
    this.ratio = ratio

    // adjust canvas size
    this.canvas.style.width = this.canvas.width + 'px'
    this.canvas.style.height = this.canvas.height + 'px'
    this.canvas.width *= ratio
    this.canvas.height *= ratio

    // enable cache
    if(options.cache) {
      this.createCacheCanvas()
    }
    // this.createEmojis()
  }

}

export default EmojiRain