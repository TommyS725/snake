const $ = document.getElementById.bind(document)

const m = 15
const n = 15

const INITIAL_LENGTH = 5



console.assert(INITIAL_LENGTH<m,'snake length must be less than nums of row')


class ListItem {
    /**
     * 
     * @param {HTMLDivElement} node 
     * @param {ListItem|null} next 
     */
    constructor(node,next=null){
        this.node = node
        this.next = next
    }

    /**
     * 
     * @param {HTMLDivElement[]} nodes 
     * @returns {[ListItem,ListItem]} [head,tail]
     */
    static fromList(nodes){
        if(nodes.length===0){
            throw Error('Empty list')
        }
        let head = null
        let cur = null
        for(let i = 0; i < nodes.length; ++i){
            const node = nodes[i]
            const item = new ListItem(node)
            if (i===0){
                head = item
            }
            if(cur){
                cur.next = item
            }
            cur = item
        }
        return [head,cur] 
    }
}

/**
 * @class
 * @constructor
 * @public
 */
class Snake{
    static ALL_DIRECTION = ['down','up','left','right']
    static DEFAULT_DIRECTION = 'down'
    /**
     * 
     * @param {Game} game instance of this game
     * @param {HTMLDivElement[]} nodes 
     * @param {Number} length 
     * @param {('down'|'up'|'left'|'right')} direction 
     * @param {Number} i row index of board
     * @param {Number} j col index of board
     */
    constructor(game,nodes,length,direction=Snake.DEFAULT_DIRECTION,i,j){
        const [first,last] = ListItem.fromList(nodes)
        this.game = game
        this.head = last //last node is the bottom -> head
        this.tail = first
        this.length = length
        this.direction = direction
        this.i = i //cur row
        this.j = j 
        /**
         * @type {('down'|'up'|'left'|'right')}
         */
        this.prevDirection = 'down'
        
        this.head.node.classList.add('head')
    }

    /**
     * 
     * @param {('down'|'up'|'left'|'right')} dir 
     */
    setDirection(dir){
        this.direction = dir
    }


    oppositeDirection(dir=this.prevDirection){
        switch(dir){
            case 'down':
                return 'up'
            case 'left':
                return 'right'
            case 'right':
                return 'left';
            case 'up':
                return 'down';
            default:
                throw new Error('Invalid direction')
        }
    }

    nextCorrd(){
        switch (this.direction) {
            case 'down':
                return [this.i+1,this.j]
            case 'left':
                return [this.i,this.j-1]
            case 'right':
                return [this.i,this.j+1]
            case 'up':
                return [this.i-1,this.j]
            default:
                throw new Error('Invalid direction')
                break;
        }
    }

    move(){
        const [ni,nj] = this.nextCorrd()
        //in bound is checked by the func
        const block = this.game.getBlock(ni,nj)
        //check is snake
        if(block.classList.contains('snake')){
            throw new Error('Hit own body')
        }
        //check get fruit
        const grow = block.classList.contains('fruit')
        if(!grow){
            this.tail.node.classList.remove('snake')
            this.tail = this.tail.next;
        }else{
            //do not cut tail
            block.classList.remove('fruit')
            this.game.ateFruit()
        }
        const  listNode = new ListItem(block);
        this.head.node.classList.remove('head')
        this.head.next = listNode
        this.head = this.head.next
        this.head.node.classList.add('snake','head')
        this.i = ni
        this.j = nj
        this.prevDirection = this.direction
    }
    
    stop(){
        clearInterval(this.interval)
    }

    /**
     *@param {Number} speed time interval to move one block
     */
    run(speed=500){
        this.stop()
        this.interval = setInterval(()=>{
            try {
                this.move()
            } catch (error) {
                this.game.end(error.message)
            }
        },speed)
    }

}

class PointsRecord {
    static localStorageKey = 'SNAKE_RECORD'
    static defaultRecord = {
        'easy':0,
        'normal':0,
        'hard':0,
    }
    constructor(){
       const stored = PointsRecord.parseRecord(this.getStored())
       this.currentRecord = stored
    }
    //if unable to parse will return default record
    static parseRecord(item){
        // console.log(item,typeof item)
        if(!item) return PointsRecord.defaultRecord
        if(typeof item  === 'string'){
            item = JSON.parse(item)
        }
        if(typeof item !== 'object'){
            return  PointsRecord.defaultRecord
        }
        for(let diff of Difficulty.validDifficulty){
            // console.log(diff)
            // console.log(item,item[diff])
            if(typeof item[diff] !== 'number'){
                return PointsRecord.defaultRecord
            }
        }
        return item
    }
    getStored(){
        const stored =  localStorage.getItem(PointsRecord.localStorageKey)
        return PointsRecord.parseRecord(stored)
    }
    /**
     * @param {Record<String,Number>} record
     */
    setStored(record){
        const str = JSON.stringify(record)
        return localStorage.setItem(PointsRecord.localStorageKey,str)
    }
    getRecord(){
        return this.currentRecord
    }
    setRecord(rec){
        // console.log('rec',rec)
        rec = PointsRecord.parseRecord(rec)
        this.setStored(rec)
        this.currentRecord = rec
        return void 0 
    }
    /**
     * @param {('easy'|'normal'|'hard')} diff
     * @returns {Number}
     */
    getRecoredPoints(diff){
       return this.currentRecord[diff] ?? 0
    }
    /**
     * @param {('easy'|'normal'|'hard')} diff
     * @param {Number} pts
     * @returns {Number}
     */
    updateRecoredPoints(diff,pts){
        const copy = {...this.getRecord()}
        copy[diff] = pts
        // console.log('copy',copy)
        this.setRecord(copy)

     }

}




class Difficulty {
    static localStorageKey = 'SNAKE_DIFFICULTY'
    static validDifficulty = ['easy','normal','hard']

    /**
     * @type {('easy'|'normal'|'hard')}
     */
    static defaultDifficulty = 'normal'
    /**
     * @type {('easy'|'normal'|'hard')}
     */
    currentDifficulty = this.defaultDifficulty
    constructor(){
       const stored = this.getStored()
       this.setDifficulty(stored??Difficulty.defaultDifficulty)
    }
    getStored(){
        return localStorage.getItem(Difficulty.localStorageKey)
    }
    /**
     * @param {('easy'|'normal'|'hard')} diff
     */
    setStored(diff){
        return localStorage.setItem(Difficulty.localStorageKey,diff)
    }
    getDifficulty(){
        return this.currentDifficulty
    }
     /**
     * @param {('easy'|'normal'|'hard')} diff
     */
    setDifficulty(diff){
        this.setStored(diff)
        this.currentDifficulty = diff
        return void 0 
    }
    /**
     * 
     * @returns {Number}
     */
    getSpeed(){
        switch (this.currentDifficulty) {
            case 'easy':
                return 200
            case 'normal':
                return 100
            case 'hard':
                return 50
            default:
                //wrong key
                this.setDifficulty(Difficulty.defaultDifficulty)
                return this.getSpeed()
                break;
        }
    }

}

class Game {
    static ALL_STATUS = ['running','stop','end']
    

    /**
     * 
     * @param {HTMLElement} entry
     * @param {Number} m
     * @param {Number} n
     * @param {Object} btns
     * @param {HTMLButtonElement} btns.up 
     * @param {HTMLButtonElement} btns.down
     * @param {HTMLButtonElement} btns.left
     * @param {HTMLButtonElement} btns.right
     * @param {HTMLButtonElement} btns.start
     * @param {Object} fields
     * @param {HTMLElement} fields.points
     * @param {HTMLElement} fields.record
     * @param {HTMLElement} fields.difficulty
     */
    constructor(entry,m,n,btns,fields){
        this.entry = entry
        const grid = document.createElement('div')
        this.m = m
        this.n = n
        /**
         * @type{('down'|'up'|'left'|'right')}
         */
        this.direction
        this.buttons = btns
        this.fields = fields
        /**
        * @type {('stop'|'running'|'end')}
        */
        this.status = 'end'
        this.setStatus('end')
        
       
        grid.id = 'grid'
        // grid.classList.add('w-fit','grid','gap-1')
        grid.style.gridTemplateRows = `repeat(${m}, minmax(0, 1fr))`
        grid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`
        this.grid = grid
        entry.insertBefore(grid,$('controll'))
        this.difficulty = new Difficulty()
        this.record = new PointsRecord()
        this.connectButtons()
        this.updateDifficulty(this.difficulty.getDifficulty())
        // console.log(this.snake)
    }
    
    initGameBoard(){
        this.grid.innerHTML=''
        const  snakes = []
        const board = []
        
        for(let i=0;i<m;++i){
            const row = []
            for(let j =0; j<n;++j){
                const isSnake = i < INITIAL_LENGTH && i <m && j==0
                const child = isSnake?snakeDiv():item()
                this.grid.appendChild(child)
                row.push(child)
                // child.innerHTML = i+' '+j
                if(isSnake){
                    snakes.push(child)
                }
            }
            board.push(row)
        }
        /**
         * @type {HTMLDivElement[][]}
         */
        this.board = board
        // console.log(this.board)
        /**
         * @type {Snake}
         */
        this.snake = new Snake(this,snakes,INITIAL_LENGTH,this.direction,INITIAL_LENGTH-1,0)
        this.points = 0
        this.generateFruit(5)
        this.fields.points.innerText = this.points


    }

    /**
     * 
     * @param {('stop'|'running'|'end')} status 
     */
    setStatus(status){
        this.entry.classList.remove(...Game.ALL_STATUS)
        this.entry.classList.add(status)
        this.status = status
    }

    inBound(i,j){
        const iIn = i >=0 && i <this.m
        const jIn = j >=0 && j < this.n
        return iIn && jIn
    }

    /**
     * 
     * @param {Number} i 
     * @param {Number} j 
     */
    getBlock(i,j){
        //todo use self implemented error
        if(!this.inBound(i,j)){
            throw new Error('Hit boundary')
        }
        return this.board[i][j]
    }

    /**
     * 
     * @param {Number} num 
     */
    generateFruit(num=1){
        const emptyBlocks = document.querySelectorAll('div.block:not(.snake)')
        num = Math.min(num,emptyBlocks.length)
        const indexes = Array.from({length:num}).map(()=>Math.floor(Math.random() * emptyBlocks.length))
        for(let idx of indexes){
            emptyBlocks[idx].classList.add('fruit')
        }
    }
    /**
     * 
     * @param {Number} num
     */
    updatePoints(num){
        this.points+=num
        this.fields.points.innerText = this.points
        if(this.points > this.recorded){
            this.recorded = this.points
            this.fields.record.innerText = this.points
        }
    }   
    
    checkAndUpdateRecord(){
        // console.log(this.points,this.recorded)
        if(this.points >= this.recorded){
            this.record.updateRecoredPoints(this.difficulty.getDifficulty(),this.points)
        }
    }
    /**
     * 
     * @param {('easy'|'normal'|'hard')} diff 
     */
    updateDifficulty(diff){
        this.difficulty.setDifficulty(diff)
        this.fields.difficulty.innerText = capitalize(diff)
        this.recorded = this.record.getRecoredPoints(diff)
        this.fields.record.innerText = this.recorded

   }

    ateFruit(num=1){
        this.updatePoints(num)
        this.generateFruit(num)
    }

    /**
     * 
     * @param {('down'|'up'|'left'|'right')} dir 
     */
    changeDirection(dir){
        const cur = this.direction
        //fixed:opp to moved direction instead of direction set
        if(dir === this.snake.oppositeDirection() ){
            //invalid choice
            this.buttons[dir].classList.add('invalid')
            setTimeout(() => {
                this.buttons[dir].classList.remove('invalid')
            }, 50);
            return
        }
        this.buttons[cur]?.classList.remove('on')
        this.direction = dir
        this.snake.setDirection(dir)
        this.buttons[dir].classList.add('on')
    }

    unsetDirection(){
        this.direction = undefined
        for(let dir of Snake.ALL_DIRECTION){
            this.buttons[dir]?.classList.remove('on')
        }

    }

   
    connectButtons(){
        const {up,left,right,down,start} = this.buttons
        up.onclick = ()=>this.changeDirection('up')
        down.onclick = ()=>this.changeDirection('down')
        left.onclick = ()=>this.changeDirection('left')
        right.onclick = ()=>this.changeDirection('right')
        start.onclick=()=>{
            switch(this.status){
                case 'running':
                    this.stop()
                    break;
                case 'stop':
                    this.resume()
                    break
                case 'end':
                    this.start()
                    break;
                default:
                    break;
            }
        }
        document. onkeydown= (ev)=>{
            // console.log(ev.code)
            switch (ev.code) {
                case 'ArrowLeft':
                    ev.preventDefault()
                    left.click()
                    break;
                case 'ArrowUp':
                    ev.preventDefault()
                    up.click()
                    break;
                case 'ArrowRight':
                    ev.preventDefault()
                    right.click()
                    break;
                case 'ArrowDown':
                    ev.preventDefault()
                    down.click()
                    break;
                case 'Space':
                case 'Enter':
                    ev.preventDefault()
                    start.click()
                    break
                default:
                    break;
            }
        }

        this.fields.difficulty.onclick = ()=>this.changeDifficulty()

    }


    changeDifficulty(){
        if(this.status !== 'end'){
            return
        }
        const diffs = Difficulty.validDifficulty
        const cur = this.difficulty.getDifficulty()
        const idx = diffs.findIndex(val=>val===cur)
        // console.log(cur,idx)
        const newDiff = idx <0?Difficulty.defaultDifficulty:
        Difficulty.validDifficulty[(idx+1)%Difficulty.validDifficulty.length]

        this.updateDifficulty(newDiff)
    }



    countDownStart(seconds=3){
        seconds = seconds >=0 ? seconds : 3
        // e.g. [1,2,3]
        const range = Array.from({length:seconds})
        .map((_,idx)=>idx+1)
        let interval = undefined
        const fn = ()=>{
            const val = range.pop()
            if(!val){
                this.changeStartText('Pause')
                this.snake.run(this.difficulty.getSpeed())
                clearInterval(interval)
                return 
            }
            //set to the number if have count down
            this.changeStartText(val)
        }

        //call and set 1s interval and clean up when val = 0
        fn()
        if(range.length){
            interval = setInterval(fn,1000)
        }
    }

    /**
     * 
     * @param {('Start'|'Restart'|'Pause'|'Resume')|Number} text 
     */
    changeStartText(text){
        this.buttons.start.innerText =text
    }

    stop(){
        this.snake.stop()
        this.setStatus('stop')
        this.changeStartText('Resume')
    }

    resume(){
        this.snake.run(this.difficulty.getSpeed())
        this.setStatus('running')
        this.changeStartText('Pause')
    }

    start(){
        if(!this.direction){
            this.changeDirection(Snake.DEFAULT_DIRECTION)
        }
        if(this.restart){
            // the flag is only on after one game is played
            this.initGameBoard()
        }
        this.setStatus('running')
        this.countDownStart(3)
        
    }

    /**
     * 
     * @param {String} reason 
     */
    end(reason){
        this.snake.stop()
        this.changeStartText('Restart')
        this.restart = true
        this.setStatus('end')
        this.checkAndUpdateRecord()
        this.unsetDirection()
        alert(reason)
    }
}


function item (){
    const div = document.createElement('div')
    // div.classList.add('size-4','sm:size-6','md:size-8','block')
    div.classList.add('block')
    return div
}

function snakeDiv (){
    const div = item()
    div.classList.add('snake')
    return div
}

/**
 * 
 * @param {String} str 
 */
function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1)
}


const main = document.querySelector('main')
const btns = {
    up:$('up-btn'),
    down:$('down-btn'),
    left:$('left-btn'),
    right:$('right-btn'),
    start:$('start-btn')
}

const fields = {
    points:$('points'),
    difficulty:$('difficulty'),
    record:$('record')
}


const game = new Game(main,m,n,btns,fields)
game.initGameBoard()






