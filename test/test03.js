// このプログラムは迷路に関するプログラムなので推論には
// あまり関係なし。Mazeのメソッドの名前からだいたい様相
// してもらったら十分。
class Maze {
  map = [//1つ目の添え字がY座標，2つ目の添え字がX座標
    ['■','■','■','■','■','■','■','■','■','■','■','■','■','■','■','■'],
    ['■','Ｓ','　','　','■','　','　','　','■','　','　','　','　','　','　','■'],
    ['■','　','■','　','■','■','■','　','■','　','■','■','　','■','　','■'],
    ['■','　','■','　','　','　','■','　','■','　','■','　','　','■','　','■'],
    ['■','　','■','■','■','■','■','　','　','　','■','　','■','■','　','■'],
    ['■','　','　','　','　','　','　','　','■','■','■','■','■','■','　','■'],
    ['■','　','■','■','■','■','■','■','■','　','　','■','　','　','　','■'],
    ['■','　','　','　','■','　','■','　','　','　','　','■','■','■','　','■'],
    ['■','　','■','　','　','　','■','■','　','■','　','　','　','■','　','■'],
    ['■','　','■','　','■','　','■','　','　','■','■','■','　','■','　','■'],
    ['■','　','■','■','■','■','■','■','　','■','　','　','　','■','■','■'],
    ['■','　','　','　','　','■','　','　','　','■','　','■','　','　','　','■'],
    ['■','　','■','■','■','■','　','■','　','■','　','■','　','■','　','■'],
    ['■','　','　','　','■','　','　','■','　','■','　','■','■','■','■','■'],
    ['■','　','■','　','　','　','■','■','　','■','　','　','　','　','Ｇ','■'],
    ['■','■','■','■','■','■','■','■','■','■','■','■','■','■','■','■']
  ];
  dirs = ['→','↑','←','↓'];
  x; // AIのX
  y; // AIのY
  gx; // ゴール地点のX
  gy; // ゴール地点のY
  dir; // AIの向き
  htmlElement; // htmlのpre要素でページに埋め込むと迷路が表示される
  // 迷路を埋め込む場所をCSSセレクタで指定して迷路を生成
  constructor(cssSelector) {
    this.htmlElement = document.createElement("pre");
    this.htmlElement.setAttribute("style","font-family: monospace;");
    document.querySelector(cssSelector).appendChild(this.htmlElement);
    for (let iy=0;iy<this.map.length;iy++) {
      for (let ix=0;ix<this.map[iy].length;ix++) {
        if (this.map[iy][ix]==="Ｓ") {this.x = ix;this.y = iy;}
        if (this.map[iy][ix]==="Ｇ") {this.gx = ix;this.gy = iy;}
      }
    }
    this.dir = 0; // AIの最初の向きは右向き
    this.draw();
  }
  draw() {
    let str = "";
    for (let iy=0;iy<this.map.length;iy++) {
      for (let ix=0;ix<this.map[iy].length;ix++) {
        if (iy==this.y && ix==this.x)
          str += this.dirs[this.dir];
        else
          str += this.map[iy][ix];
      }
      str += "\n";
    }
    this.htmlElement.textContent = str;
//console.log("GAHA:"+(new Date()))
    setTimeout(()=>{this.draw();},1000);
  }
  goForward() {
    switch (this.dir) {
    case 0: this.x++; break;
    case 1: this.y--; break;
    case 2: this.x--; break;
    case 3: this.y++; break;
    }
    this.draw();
  }
  turnLeft() {
    this.dir = (this.dir + 1) % 4;
    this.draw();
  }
  turnRight() {
    this.dir = (this.dir + 3) % 4;
    this.draw();
  }
  getStatusOfAI() {
    //まずAIが右を向いてた場合の周りの状況を取得
    let front = this.map[this.y][this.x+1] == '■'?"あり":"なし";
    let right = this.map[this.y+1][this.x] == '■'?"あり":"なし";
    let left = this.map[this.y-1][this.x] == '■'?"あり":"なし";
    let back = this.map[this.y][this.x-1] == '■'?"あり":"なし";
    //実際のAIの向きにあわせて回転
    for (let i=0;i<this.dir;i++) {
      let tmp = front;
      front = left;
      left = back;
      back = right;
      right = tmp;
    }
    const status = {
      前壁: front,
      左壁: left,
      右壁: right
    };
    return status;
  }
  reachedTheGoal() {
    if (this.x===this.gx && this.y===this.gy)
      return true;
    else
      return false;
  }
}
