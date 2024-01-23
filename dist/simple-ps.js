(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SimplePS"] = factory();
	else
		root["SimplePS"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/parser.js":
/*!***********************!*\
  !*** ./src/parser.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parse: () => (/* binding */ parse)
/* harmony export */ });
/* harmony import */ var _simple_ps__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./simple-ps */ "./src/simple-ps.js");
/*
 * 文字列を受け取りRuleの配列を返すパーサであるrules()関数を提供。
 * もしエラーがあったらエラーメッセージの文字列を返す。
 */


// 識別子の最初の文字にマッチする正規表現
const rx_id1st = new RegExp('[a-zA-Z_\u00c0-\u1fff\u3040-\u318f\u3400-\u3d2d\u4e00-\u9fff\uf900-\ufaff]');
// 識別子の2文字目以降の文字にマッチする正規表現
const rx_id2nd = new RegExp('[a-zA-Z_\u00c0-\u1fff\u3040-\u318f\u3400-\u3d2d\u4e00-\u9fff\uf900-\ufaff0-9]');
// 数字と判定される文字にマッチする正規表現
const rx_num = new RegExp('[0-9]');

// 再帰下降構文解析で解析する。方針としてグローバル変数の
// inputStrに解析文字列を入れといて、基本1文字ずつ解析。
// その文字の位置を常にグローバル変数のidx変数に保存。
// 解析関数はinputStr.charAt(idx)から
// 解析を始める。その時に必要であれば解析が失敗することを
// 考慮してidxをidxBackupに保存しておく。もし、解析が成功
// したらidxは次に解析される文字の所まで進めておく義務がある。
// なおかつreturnで解析結果を返す。もし、解析が失敗したら
// エラーメッセージをグローバル変数のerrorMessageに書き込み、
// バックアップしていたidxBackupをidxに代入して戻しておく。
// なおかつreturnでnullを返すことにする。

let inputStr; // 解析する文字列(普通は\nが入った複数行の文字列)
let idx; // 現在解析しているinputStr中の一文字の場所
let errorMessage; // エラーメッセージを記録しておく場所

// 現在解析している場所の行番号と列番号を文字列で返す関数。
// エラーメッセージ作る時に使おう。
function lineColumnNo() {
  let line = 1;
  let column = 1;
  for (let i=0;i<idx;i++) {
    if (inputStr.charAt(i)==='\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return ""+line+":"+column;
}

// 指定した1文字を検出する解析関数
function char(c) {
  if (inputStr.charAt(idx)===c) {
    idx++;
    return c;
  }
  errorMessage = `Error(${lineColumnNo()}) ここには文字「${c}」がこなければなりません。`;
  return null;
}

// コメントは「/*」で始まり「*/」で終るコメントのみ許可
function comment() {
  const idxBackup = idx;
  if (char('/')) {
    if (char('*')) {
      while (true) {
	const idxBackup2 = idx;
	if (char('*')) {
	  if (char('/')) {
	    return "comment";
	  }
	}
	idx = idxBackup2;
	if (inputStr.charAt(idx)==='') {
	  idx = idxBackup;
	  errorMessage = `Error(${lineColumnNo()}) ここにはコメントがこなければなりません。`;
	  return null;
	}
	idx++;
      }
    }
  }
  idx = idxBackup;
  errorMessage = `Error(${lineColumnNo()}) ここにはコメントがこなければなりません。`;
  return null;
}

// 半角空白、タブ、改行の時成功。それ以外は失敗。
function whiteChar() {
  if (char(' ')) return ' ';
  if (char('\t')) return '\t';
  if (char('\n')) return '\n';
  errorMessage = `Error(${lineColumnNo()})`;
  return null;
}

// whiteSpaceまたは空文字列を検出。なので絶対成功する。
// つまりスペースが入ってても良いし入ってなくても良い
// ような場所で使う。あとコメント文もwhiteSpace扱いに
// することにした。
function whiteSpace() {
  while (true) {
    const cmt = comment();
    if (cmt)
      continue;
    const w = whiteChar();
    if (w == null)
      return "whiteSpace";
  }
}

// 関数名、変数名などの名前に相当する識別子を検出する
function id() {
  const idxBackup = idx;
  let name = '';
  let c = inputStr.charAt(idx);
  if (!c.match(rx_id1st)) {
    errorMessage = `Error(${lineColumnNo()}) ここには識別子がくるべきです。`;
    return null;
  }
  name += c;
  while (true) {
    idx++;
    c = inputStr.charAt(idx);
    if (!c.match(rx_id2nd))
      return name;
    name += c;
  }
}

// whiteSpaceを読み飛ばして入力文字列の終りを検出する
function eof() {
  const idxBackup = idx;
  const w = whiteSpace(); // 絶対成功する
  const c = inputStr.charAt(idx); // idxが範囲外の時は空文字列
  if (c === '')
    return "EOF";
  // ここまで来たら何か文字が残ってるのでエラー
  idx = idxBackup;
  errorMessage = `Error(${lineColumnNo()}): EOF(入力の最後でなければなりません。`;
  return null;
}

// 文字列を解析する。
// まだ文字列中の引用符のエスケープとかには対応してない。
function string() {
  const idxBackup = idx;
  let a = char('"');
  if (a==null)
    a = char("'");
  if (a==null) {idx=idxBackup;return null;}
  let s = '';
  while (true) {
    const c = inputStr.charAt(idx);
    if (c === '') {
      idx = idxBackup;
      errorMessage = `Error(${lineColumnNo()}) 文字列解析中に入力が終了しました。`;
      return null;
    }
    if (c === a) {
      idx++;
      break;
    }
    s += c;
    idx++;
  }
  return s;
}

// 数字を解析する。
function number() {
  const idxBackup = idx;
  let c = inputStr.charAt(idx);
  if (c !== '.' && !c.match(rx_num)) {
    errorMessage = `Error(${lineColumnNo()}) ここには数字がこなければなりません。`;
    return null;
  }
  let num = '';
  if (c === '.') { // '.'で始まる特殊な場合
    idx++; c = inputStr.charAt(idx);
    if (!c.match(rx_num)) {
      idx = idxBackup;
      return null;
    }
    idx = idxBackup;
    c = inputStr.charAt(idx);
  } else { // ここにくるのは整数部分
    num += c;
    idx++; c = inputStr.charAt(idx);
    while (c.match(rx_num)) {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
  }
  if (c === '.') { // 小数部分
    num += c;
    idx++; c = inputStr.charAt(idx);
    while (c.match(rx_num)) {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
  }
  if (c === 'e' || c === 'E') {
    num += c;
    idx++; c = inputStr.charAt(idx);
    if (c === '+' || c === '-') {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
    while (c.match(rx_num)) {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
  }
  return Number(num);
}

// 項(条件やビルトインなど)を解析。項は関数の形をしている。
function term() {
  const idxBackup = idx;
  const name = id();
  if (name == null) return null;
    whiteSpace();
  if (char('(') == null) {idx=idxBackup;return null};
  const args = []; // 引数の配列
  while (true) {
    whiteSpace();
    if (inputStr.charAt(idx) === ',')
      idx++;
    whiteSpace();
    const v = id(); if (v) {args.push(new _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Var(v));continue;} // 変数
    const n = number(); if (n) {args.push(n);continue;} // 数字
    const s = string(); if (s) {args.push(s);continue;} // 文字列
    break;
  }
  whiteSpace();
  if (char(')') == null) {idx=idxBackup;return null};
  whiteSpace();
  if (inputStr.charAt(idx) === ',')
    idx++;
  return new _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Term(name,args);
}

// ルール1本分。Ruleのインスタンスを返す。エラーならエラーメッセージを返す。
function rule() {
  const idxBackup = idx;
  whiteSpace();
  const priority = number();
  if (priority == null) { idx=idxBackup; return null; }
  whiteSpace();
  if (char(':') == null) { idx=idxBackup; return null; }
  const lhs = [];
  while (true) {
    whiteSpace();
    const cond = term(); // 1つの条件に該当
    if (cond == null) break;
    lhs.push(cond);
  }
  if (lhs.length === 0) {
    errorMessage = `Error(${lineColumnNo()}) 条件部(LHS)がありません。`;
    idx=idxBackup;
    return null;
  }
  whiteSpace();
  //if (char('-') == null) { idx=idxBackup; return null; } // やっぱり入れない
  if (char('>') == null) { idx=idxBackup; return null; }
  const rhs = [];
  while (true) {
    whiteSpace();
    const com = term(); // 1つの実行命令に該当
    if (com == null) break;
    rhs.push(com);
  }
  if (rhs.length === 0) {
    errorMessage = `Error(${lineColumnNo()}) 実行部(RHS)がありません。`;
    idx=idxBackup;
    return null;
  }
  whiteSpace();
  if (char(';') == null) { idx=idxBackup; return null; }
  return new _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Rule(priority,lhs,rhs);
}

// ルールの集合。ここが文法解析の出発点。
function rules() {
  const idxBackup = idx;
  const rs = [];
  while (true) {
    const e = eof();
    if (e)
      break; // 正常終了
    whiteSpace();
    const r = rule();
    if (r) {
      rs.push(r);
      continue;
    }
    // ここまで来たら何かエラー
    idx = idxBackup;
    // errorMessageはrule()の時のエラーを残す
    return null;
  }
  return rs;
}

// 文法解析を実行する関数。
// 解析するための文字列を引数で渡す。色々初期化してからスタート。
// 解析が成功したらRuleの配列を返す。そして、解析失敗の
// 時はエラーメッセージの文字列を返す。
// 入力が空っぽの時も成功と見なして空の配列を返す。
function parse(input) {
  inputStr = input;
  idx = 0;
  errorMessage = "";

  const rs = rules();
  if (rs === null)
    return errorMessage;
  return rs;
}




/***/ }),

/***/ "./src/simple-ps.js":
/*!**************************!*\
  !*** ./src/simple-ps.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BuiltIn: () => (/* binding */ BuiltIn),
/* harmony export */   Engine: () => (/* binding */ Engine),
/* harmony export */   Rule: () => (/* binding */ Rule),
/* harmony export */   Term: () => (/* binding */ Term),
/* harmony export */   Var: () => (/* binding */ Var)
/* harmony export */ });
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parser */ "./src/parser.js");


// 推論システム
// 推論は常に完全に停止して終了するタイプではなく
// ワーキングメモリの状況に変化があれば自動で
// 推論を再開するようにする。
// ただ、無駄にCPUを消費することが無いように、
// 実行できるルールが無い時は自動でスリープ状態にする。
// また、競合解消戦略はパート1とパート2に分けた。
// パート2は簡単でルールに設定されたプライオリティが
// 一番高いやつを選ぶだけ。パート1がむずかしくて、
// 同じルールが無限に実行され続けるのを防ぐための物。
// これの実装はRuleクラスのisNewSituation()メソッドに
// 集約した。isNewSituation()はまだ理想的な状態ではない。
// あと、OneTime推論モードというのが必要だった。普通は、
// 1度ルールが実行された後も、他に実行できるルールがある
// 時は、推論ループの中で実行されていく。でも推論を
// 1ステップごとに実行したい時もあるので、それを実装する
// ためにOneTime推論モードを導入する。これは推論エンジンの
// そのためにinferStatusに"oneTime"という状態を導入する。

//変数
class Var {
  name;
  constructor(name) {
    this.name = name;
  }
}

class Term {
  name; // 関数名に相当する部分
  args; // 引数部分
  constructor(name,args) {
    this.name = name;
    this.args = args;
  }
  toString() {
    let str = "";
    str += this.name + "("
    this.args.forEach((arg)=>{
      if (typeof arg === "number")
        str += arg + " ";
      else if (typeof arg === "string")
        str += '"' + arg + '" ';
      else if (arg.constructor.name === "Var")
        str += arg.name + " ";
      else
        str += "??? ";
    });
    str += ")"
    return str;
  }
}

class Rule {
  engine; // このルールを読み込んだEngine。後でengine自身ががセット
  priority; // 優先度
  lhs; // 条件部(Left Hand Side)(Termの配列)
  rhs; // 実行部(Right Hand Side)(Termの配列)
  env; // 変数のバインディングを保持する環境
  lastExecTime; // このルールが最後に実行された時間

  constructor(priority,lhs,rhs) {
    this.priority = priority;
    this.lhs = lhs;
    this.rhs = rhs;
    this.lastExecTime = -1;
  }
  toString() {
    let str = "";
    str += this.priority + ": ";
    this.lhs.forEach((c)=>{
      str += c.toString() + " ";
    });
    str += "> ";
    this.rhs.forEach((a)=>{
      str += a.toString() + " ";
    });
    str += ";";
    return str;
  }

  // このルールの適用条件が満されているかチェック。
  checkConditions() {
    this.env = {};
    for (let i=0;i<this.lhs.length;i++) {
      const term = this.lhs[i];
      const builtIn = this.engine.builtIns[term.name];
      if (builtIn) {
        try {
          if (!builtIn.preEval(term.args,this.env))
            return false;
        } catch(e) {
          console.log(e);
          return false;
        }
      } else {
        console.log(`${term.name}という名前のビルトインが見付かりません。`)
        return false;
      }
    }
    return true;
  }

  // 競合解消
  // このルールの条件部を判定する作業が副作用
  // (例えば変数へのバインドなど)も含め、前回の実行時と
  // まったく同じであれば「真」そうでなければ「偽」を返す・・・
  // のが理想だけど、とりあえず条件部で参照されるWMの
  // 項目が以前の実行時から更新されている物が1つでもあれば
  // 「真」そうでなければ「偽」としている。ほぼ良いと
  // 思うが、no(NoBI)ビルトインだけ特殊で、これは間にあわせ
  // の対応。
  isNewSituation() {
    let isNew = false;
    ext1: for (let i=0;i<this.lhs.length;i++) {
      const term = this.lhs[i];
      for (let j=0;j<term.args.length;j++) {
        const arg = term.args[j];
        if (arg.constructor.name === "Var") {
          const updateTime =this.engine.getInfoUpdateTime(arg.name);
          if (updateTime > this.lastExecTime) {
            isNew = true;
            break ext1;
          } else if (term.name === "no" && updateTime===undefined) {
            isNew = true;
            break ext1;
          }
        }
      }
    }
    return isNew;
  }

  // このルールの実行部を実行
  doActions() {
    this.lastExecTime = this.engine.workingMemoryTime;
    this.rhs.forEach((term)=>{
      const builtIn = this.engine.builtIns[term.name];
      if (builtIn) {
        try {
          builtIn.preEval(term.args,this.env);
        } catch(e) {
          console.log(e);
          return; // 途中終了？
        }
      } else {
        console.log(`${term.name}という名前のビルトインが見付かりません。`);
      }
    });
  }
}

// 処理は全てビルトインとして実装
// このBuiltInはそれらのスーパークラス
class BuiltIn {
  name; // 名前
  engine; // 推論エンジン(後で代入される)
  args; // 引数の配列(Termの配列)
  env; // ルールから受け取った変数の環境(変数名と値のMap)
  constructor(name) {
    this.name = name;
  }
  preEval(args,env) {
    this.args = args;
    this.env = env;
    return this.eval();
  }
  eval() {
    // このBuiltInに必要な処理を行う。BuiltInには引数、
    // 変数、ワーキングメモリにアクセスするための各種
    // メソッドがあるので、これを使って必要な処理をする。
    // このBuiltInを条件部で使うならばtrueかfalseを
    // returnすること。処理によっては例外をthrowする
    // ことができるものとする。
  }
  // 引数の数を返す
  getArgsNum() {
    return this.args.length;
  }
  // 引数の数をチェックしてダメな時は例外を発生
  checkArgsNum(n) {
    if (this.args.length != n)
      throw new Error(`${this.name}(${this.constructor.name}) 必ず${n}の引数を指定して下さい。`);
  }
  // 引数のn番目の変数の名前を取り出す。変数でなければ例外を発生。
  getArgAsName(n) {
    if (this.args[n].constructor.name != "Var")
      throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は変数でなければなりません。`);
    return this.args[n].name;
  }
  // 引数のn番目を数字として取り出す。数字でない時は例外を発生。
  // 変数の時はその中もチェックして判断。
  getArgAsNum(n) {
    if (typeof this.args[n] === "number")
      return this.args[n];
    else if (this.args[n].constructor.name == "Var") {
      const v = this.env[this.args[n].name];
      if (typeof v === "number")
        return v;
      else (typeof v === undefined || typeof v === null)
        throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は数値でなければなりません。`);
  }
  // 引数のn番目を文字列として取り出す。文字列でない時は例外を発生。
  // 変数の時はその中もチェックして判断。
  getArgAsStr(n) {
    if (typeof this.args[n] === "string")
      return this.args[n];
    else if (this.args[n].constructor.name == "Var") {
      const v = this.env[this.args[n].name];
      if (typeof v === "string")
        return v;
      else (typeof v === undefined || typeof v === null)
        throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は文字列でなければなりません。`);
  }
  // 引数のn番目の値を取り出す。もし空の時は例外を発生。
  // 変数の時はその中もチェックして判断。
  getArgIfNotEmpty(n) {
    if (typeof this.args[n] === "number")
      return this.args[n];
    else if (typeof this.args[n] === "string") {
      return this.args[n];
    } else if (this.args[n].constructor.name == "Var") {
      const v = this.env[this.args[n].name];
      if (typeof v === "number")
        return v;
      else if (typeof v === "string")
        return v;
      else (typeof v === undefined || typeof v === null)
        throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は不明な値です。`);
  }
  // n番目の引数から値を取り出す。変数の時はそれも展開する。
  // getArgIfNotEmptyと異なりデータが空の時はnullを返す。
  getArg(n) {
    if (typeof this.args[n] === "number")
      return this.args[n];
    else if (typeof this.args[n] === "string")
      return this.args[n];
    else if (this.args[n].constructor.name === "Var") {
      const v = this.env[this.args[n].name];
      return v;
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
  }
  // 変数に値を代入する
  setVar(name,value) {
    this.env[name] = value;
  }
  // 変数から値を取り出す
  getVar(name) {
    return this.env[name];
  }
  // keyとvalueのセットを受けとりワーキングメモリに情報を追加または上書き
  addInfoToWM(keyValue) {
    this.engine.addInfoToWM(keyValue);
  }
  // infoNameとvalueを受けとりワーキングメモリに情報を追加または上書き
  addOneInfoToWM(infoName,value) {
    this.engine.addOneInfoToWM(infoName,value);
  }
  // ワーキングメモリから情報を取り出す
  getInfoFromWM(infoName) {
    return this.engine.getInfoFromWM(infoName);
  }
  // ワーキングメモリから情報を削除
  delInfoFromWM(infoName) {
    this.engine.delInfoFromWM(infoName);
  }
  // ワーキングメモリを空にする
  clearWM() {
    this.engine.clearWM();
  }
}

// 推論エンジン本体。中にルールなど全部入っている。
class Engine {
  rules; // ルールの配列
  builtIns; // ビルトインのMap
  workingMemory; // ワーキングメモリのMap
  workingMemoryTime; // ワーキングメモリの更新時刻
  // 推論の実行状態(inferStatus)
  // "stoped": 停止中(wmに変化があっても走り出さない)
  // "waitForRun": 次の実行を待機中
  // "running": まさに実行中
  // "standby": 実行中ではあるが今やることがないので待機中
  // "waitForStop": 停止要求は出されてるけどまだ実行中の場合
  // "oneTime": oneTime推論モード。この状態の時には状態は変化させない。
  inferStatus;
  timeoutID; // setTimeoutを止めるために記録(整数)

  constructor(ruleStr) {
    if (ruleStr === undefined)
      this.rules = [];
    else
      this.rules = (0,_parser__WEBPACK_IMPORTED_MODULE_0__.parse)(ruleStr);
    this.rules.forEach((rule)=>{
      rule.engine = this;
    });
    this.builtIns = {};
    this.workingMemory = {};
    this.workingMemoryTime = 0;
    this.inferStatus = "stoped";
    this.timeoutID = 0;

    this.addBuiltIn(new SearchBI());
    this.addBuiltIn(new NoBI());
    this.addBuiltIn(new GtBI());
    this.addBuiltIn(new LtBI());
    this.addBuiltIn(new GeBI());
    this.addBuiltIn(new LeBI());
    this.addBuiltIn(new EqBI());
    this.addBuiltIn(new NeqBI());
    this.addBuiltIn(new RangeBI());
    this.addBuiltIn(new Range2BI());
    this.addBuiltIn(new SeqBI());
    this.addBuiltIn(new SgtBI());
    this.addBuiltIn(new SltBI());
    this.addBuiltIn(new SgeBI());
    this.addBuiltIn(new SleBI());
    this.addBuiltIn(new SetBI());
    this.addBuiltIn(new StoreBI());
    this.addBuiltIn(new Store2BI());
    this.addBuiltIn(new DelBI());
    this.addBuiltIn(new AddBI());
    this.addBuiltIn(new SubBI());
    this.addBuiltIn(new MulBI());
    this.addBuiltIn(new DivBI());
    this.addBuiltIn(new ConcatBI());
    this.addBuiltIn(new LogBI());
    this.addBuiltIn(new RandBI());
    this.addBuiltIn(new ModBI());
    this.addBuiltIn(new FloorBI());
    this.addBuiltIn(new SneqBI());
    this.addBuiltIn(new StopBI());
    this.addBuiltIn(new WmBI());
    this.resultBI = new ResultBI();
    this.addBuiltIn(this.resultBI);
  }

  // ビルトインを追加
  addBuiltIn(builtIn) {
    builtIn.engine = this;
    this.builtIns[builtIn.name] = builtIn;
  }

  // keyとvalueのセットを受けとりワーキングメモリに情報を追加または上書き
  addInfoToWM(keyValue) {
    this.workingMemoryTime++;
    Object.keys(keyValue).forEach((infoName)=>{
      const value = keyValue[infoName];
      if (value === undefined) value = null;
      this.workingMemory[infoName] = {updateTime:this.workingMemoryTime,value};
    });
    
    switch(this.inferStatus) {
    case "stoped": break; // 何もしなくてOK
    case "waitForRun": break; // 何もしなくて良いはず
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "waitForStop": break; // 何もしなくて良いはず
    case "oneTime": break; // 何もしなくて良いはず
    }
  }

  // infoNameとvalueを受けとりワーキングメモリに情報を追加または上書き
  addOneInfoToWM(infoName,value) {
    if (value === undefined)
      value = null; // 基本undefinedは入れないようにする
    const kv = {};
    kv[infoName] = value;
    this.addInfoToWM(kv);
  }

  // まずワーキングメモリを空にしてから、keyとvalueの
  // セットを受けとりワーキングメモリに情報をセット
  setInfoToWM(keyValue) {
    this.workingMemoryTime++;
    this.workingMemory = {};
    Object.keys(keyValue).forEach((infoName)=>{
      const value = keyValue[infoName];
      if (value === undefined) value = null;
      this.workingMemory[infoName] = {updateTime:this.workingMemoryTime,value};
    });
    
    switch(this.inferStatus) {
    case "stoped": break; // 何もしなくてOK
    case "waitForRun": break; // 何もしなくて良いはず
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "waitForStop": break; // 何もしなくて良いはず
    case "oneTime": break; // 何もしなくて良いはず
    }
  }

  // ワーキングメモリから情報を取り出す
  getInfoFromWM(infoName) {
    const info = this.workingMemory[infoName];
    if (!info) return undefined;
    return info.value;
  }

  // ワーキングメモリから情報を消去
  delInfoFromWM(infoName) {
    this.workingMemoryTime++;
    delete this.workingMemory[infoName];
    switch(this.inferStatus) {
    case "stoped": break; // 何もしなくてOK
    case "waitForRun": break; // 何もしなくて良いはず
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "waitForStop": break; // 何もしなくて良いはず
    case "oneTime": break; // 何もしなくて良いはず
    }
  }

  // ワーキングメモリを空にする
  clearWM(infoName) {
    this.workingMemoryTime++;
    this.workingMemory = {};
    switch(this.inferStatus) {
    case "stoped": break; // 何もしなくてOK
    case "waitForRun": break; // 何もしなくて良いはず
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "waitForStop": break; // 何もしなくて良いはず
    case "oneTime": break; // 何もしなくて良いはず
    }
  }

  // ワーキングメモリから情報の更新時間を取り出す
  getInfoUpdateTime(infoName) {
    const info = this.workingMemory[infoName];
    if (!info) return undefined;
    return info.updateTime;
  }

  // ワーキングメモリの内容を文字列でダンプ
  dumpWM() {
    let str = "[WM update="+this.workingMemoryTime+"]";
    Object.keys(this.workingMemory).forEach((key)=>{
      str += key + ":";
      str += this.workingMemory[key].value + "(";
      str += this.workingMemory[key].updateTime + ") ";
    });
    return str;
  }

  // 推論をスタート(内部使用。単純に推論をスタートさせる)
  justStart() {
//console.trace("GAHA");
    this.timeoutID = setTimeout(()=>{this.inferLoop();},0);
    this.inferStatus = "waitForRun";
  }
  
  // 推論をスタート(外部からの呼び出し用)
  start() {
    switch(this.inferStatus) {
    case "stoped": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "waitForRun": break; // 何もしなくて良いはず
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "waitForStop": this.justStart(); this.inferStatus = "waitForRun"; break; // 起動
    case "oneTime": break; // 何もしないということにする
    }
  }

  // 推論[照合、競合解消、実行]の1ステップだけ実行
  inferOneStep() {
    switch(this.inferStatus) {
    case "stoped": this.justStart(); this.inferStatus = "oneTime"; break; // 実行
    case "waitForRun": this.inferStatus = "oneTime"; break; // 実行
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "oneTime"; break; // 実行
    case "waitForStop": this.inferStatus = "oneTime"; break; // 実行
    case "oneTime": this.justStart(); this.inferStatus = "oneTime"; break; // 実行
    }
  }

  // 推論[照合、競合解消、実行]の1ステップだけ実行して
  // result(ResultBI)による結果が出るまで待って、結果を返す。
  // 推論結果を待つ時間(ミリ秒)をtimeout引数で指定できる。
  async inferOneStepAndWait(timeout) {
    switch(this.inferStatus) {
    case "stoped": this.justStart(); this.inferStatus = "oneTime"; break; // 実行
    case "waitForRun": this.inferStatus = "oneTime"; break; // 実行
    case "running": break; // ありえないはず
    case "standby": this.justStart(); this.inferStatus = "oneTime"; break; // 実行
    case "waitForStop": this.inferStatus = "oneTime"; break; // 実行
    case "oneTime": this.justStart(); this.inferStatus = "oneTime"; break; // 実行
    }
    return await this.resultBI.getResult(timeout);
  }

  // 推論のループ制御。
  inferLoop() {
//console.log("GAHA0:Engine.inferLoop() ******************************");
//console.log("GAHA1:",this.dumpWM());
//console.log("GAHA2:inferStatus=",this.inferStatus);
    let isOneTimeMode = false;
    switch(this.inferStatus) {
    case "stoped": return; // ありえない
    case "waitForRun": break; // 普通。Go ahead!
    case "running": break; // ありえないはず
    case "standby": break; // ありえないはず
    case "waitForStop": this.inferStatus = "stoped"; return; // 止める
    case "oneTime": isOneTimeMode = true; break; // モード指定でGo!
    }
    this.inferStatus = "running";

    // 照合
    let conflictSet = [];
    this.rules.forEach((rule)=>{
      if (rule.checkConditions(this.workingMemory))
        conflictSet.push(rule);
    });
//console.log("GAHA3:conflictSet=",conflictSet);

    // 競合解消1
    // 照合ステップにおいてルールの条件部(LHS)が前回の実行時
    const tmpSet = [];
    conflictSet.forEach((rule)=>{
      if (rule.isNewSituation())
        tmpSet.push(rule);
    });
    conflictSet = tmpSet;
//console.log("GAHA4:conflictSet=",conflictSet);

    // 競合解消2
    // priorityが一番高い物を抽出
    let maxPriority = -1;
    let targetRule = null;
    conflictSet.forEach((rule)=>{
      if (maxPriority<rule.priority) {
        targetRule = rule;
        maxPriority = rule.priority;
      }
    });
//console.log("GAHA5:maxPriority=",maxPriority);
//console.log("GAHA6:targetRule=",(targetRule?targetRule.toString():null));
//console.log("GAHA7:",this.dumpWM());
    // 実行部
    // JavaScriptはシングルスレッドで
    // このメソッド中にはawaitとかは含まないので
    // このメソッドの実行中にthis.inferStatusが
    // かわることはないとはずなのでまよわず以下。
    if (targetRule !== null) {
      targetRule.doActions();
      if (isOneTimeMode===true) {
        this.inferStatus = "oneTime";
      } else {
        this.justStart();
        this.inferStatus = "waitForRun";
      }
    } else {
      this.inferStatus = "standby";
    }
  }

  // 推論を停止させます
  stop() {
    // シングルレッドだし、もしそうでなくても
    // たぶんclearTimeout()しても実行中だったら
    // それは止まらないという過程で書く。
    switch(this.inferStatus) {
    case "stoped": break; // 何もしなくてOK
    case "waitForRun": // 止める
      clearTimeout(this.timeoutID);
      this.inferStatus = "stoped";
      break;
    case "running": break; // ありえないはず
    case "standby": // clearTimeout()いらないはず
      this.inferStatus = "stoped";
      break;
    case "waitForStop": break; // 何もしなくて良いはず
    case "oneTime": break; // 何もしなくて良いはず
    }
  }
}

/************************
 * 以下ビルトインの実装 *
 ************************/

// ワーキングメモリを探索するして情報があれば変数にセットするビルトイン
class SearchBI extends BuiltIn {
  constructor() {super("s");}
  eval() {
    this.checkArgsNum(1);
    const name = this.getArgAsName(0);
    const v = this.getInfoFromWM(name);
    if (v === undefined)
      return false;
    this.setVar(name,v);
    return true;
  }
}

// 第一引数で指定した情報がワーキングメモリに
// 無い場合にtrue．そうでない場合にfalseを返す．
class NoBI extends BuiltIn {
  constructor() {super("no");}
  eval() {
    this.checkArgsNum(1);
    const name = this.getArgAsName(0);
    const v = this.getInfoFromWM(name);
    if (v === undefined)
      return true;
    else
      return false;
  }
}

// より大きい(>)の条件判断関数
class GtBI extends BuiltIn {
  constructor() {super("gt");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    if (o1>o2)
      return true;
    else
      return false
  }
}

// より小さい(<)の条件判断関数
class LtBI extends BuiltIn {
  constructor() {super("lt");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    if (o1<o2)
      return true;
    else
      return false
  }
}

// 以上(>=)の条件判断関数
class GeBI extends BuiltIn {
  constructor() {super("ge");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    if (o1>=o2)
      return true;
    else
      return false
  }
}

// 以下(<=)の条件判断関数
class LeBI extends BuiltIn {
  constructor() {super("le");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    if (o1<=o2)
      return true;
    else
      return false
  }
}

// 等しいかどうかの条件判断関数
class EqBI extends BuiltIn {
  constructor() {super("eq");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgIfNotEmpty(0);
    const o2 = this.getArgIfNotEmpty(1);
    if (o1===o2)
      return true;
    else
      return false
  }
}

// 等しくないかどうかの条件判断関数
class NeqBI extends BuiltIn {
  constructor() {super("neq");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgIfNotEmpty(0);
    const o2 = this.getArgIfNotEmpty(1);
    if (o1!==o2)
      return true;
    else
      return false
  }
}

// 数値が，ある範囲におさまっているかどうかの件判断関数(>=,<=)
class RangeBI extends BuiltIn {
  constructor() {super("range");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const o3 = this.getArgAsNum(2);
    if (o2>o3)
      throw new Error("range(RangeBI) (第2引数 <= 第3引数) でなければなりません。");
    if (o2>=o1)
      return false;
    if (d2<=d3)
      return false;
    return true;
  }
}

// 数値が，ある範囲におさまっているかどうかの件判断関数(>,<)
class Range2BI extends BuiltIn {
  constructor() {super("range2");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const o3 = this.getArgAsNum(2);
    if (o2>=o3)
      throw new Error("range(RangeBI) 第2引数 < 第3引数 でなければなりません。");
    if (o2>o1)
      return false;
    if (d2<d3)
      return false;
    return true;
  }
}

// SeqBI = SearchBI + EqBI
class SeqBI extends BuiltIn {
  constructor() {super("seq");}
  eval() {
    this.checkArgsNum(2);
    const name = this.getArgAsName(0);
    const v1 = this.getInfoFromWM(name);
    if (v1 === undefined)
      return false;
    this.setVar(name,v1);
    const v2 = this.getArg(1);
    if (v1 === v2)
      return true;
    else
      return false;
  }
}

// SgtBI = SearchBI + GtBI
class SgtBI extends BuiltIn {
  constructor() {super("sgt");}
  eval() {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SltBI = SearchBI + LtBI
class SltBI extends BuiltIn {
  constructor() {super("slt");}
  eval() {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SgeBI = SearchBI + GeBI
class SgeBI extends BuiltIn {
  constructor() {super("sge");}
  eval() {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SleBI = SearchBI + LeBI
class SleBI extends BuiltIn {
  constructor() {super("sle");}
  eval() {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 変数に値を代入するための関数
class SetBI extends BuiltIn {
  constructor() {super("set");}
  eval() {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// ワーキングメモリに情報をセットする関数
// 1つの変数を引数に取り、その変数の名前と値でセット
class StoreBI extends BuiltIn {
  constructor() {super("st");}
  eval() {
    this.checkArgsNum(1);
    const name = this.getArgAsName(0);
    const v = this.getVar(name);
    this.addOneInfoToWM(name,v);
    return true;
  }
}

// ワーキングメモリに情報をセットする関数
// 2つの引数に取り、1つ目の名前で2つ目の値をセット
class Store2BI extends BuiltIn {
  constructor() {super("st2");}
  eval() {
    this.checkArgsNum(2);
    const name = this.getArgAsName(0);
    const value = this.getArg(1);
    this.addOneInfoToWM(name,value);
  }
}

// ワーキングメモリから情報を消す関数
class DelBI extends BuiltIn {
  constructor() {super("del");}
  eval() {
    this.checkArgsNum(1);
    const name = this.getArgAsName(0);
    this.delInfoFromWM(name);
  }
}

// 足し算を行う関数
class AddBI extends BuiltIn {
  constructor() {super("add");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const name = this.getArgAsName(2);
    this.setVar(name,o1 + o2);
  }
}

// 引き算を行う関数
class SubBI extends BuiltIn {
  constructor() {super("sub");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const name = this.getArgAsName(2);
    this.setVar(name,o1 - o2);
  }
}

// かけ算を行う関数
class MulBI extends BuiltIn {
  constructor() {super("mul");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const name = this.getArgAsName(2);
    this.setVar(name,o1 * o2);
  }
}

// 割り算を行う関数
class DivBI extends BuiltIn {
  constructor() {super("div");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const name = this.getArgAsName(2);
    if (o2 === 0)
      throw new Error("div(DivBI) 割る数が0です。");
    this.setVar(name,o1 / o2);
  }
}

// 文字列の結合を行う関数
class ConcatBI extends BuiltIn {
  constructor() {super("concat");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsStr(0);
    const o2 = this.getArgAsStr(1);
    const name = this.getArgAsName(2);
    this.setVar(name,o1 + o2);
  }
}

// 文字列を標準出力に表示する関数
class LogBI extends BuiltIn {
  constructor() {super("log");}
  eval() {
    let str = '';
    const n = this.getArgsNum();
    for (let i=0;i<n;i++) {
      const v = this.getArg(i);
      str += v;
    }
    console.log(str);
  }
}

// [0.0-1.0)の乱数を生成する関数
class RandBI extends BuiltIn {
  constructor() {super("rand");}
  eval() {
    this.checkArgsNum(1);
    const name = this.getArgAsName(0);
    this.setVar(name,Math.random());
  }
}

// あまりの計算(mod)
class ModBI extends BuiltIn {
  constructor() {super("mod");}
  eval() {
    this.checkArgsNum(3);
    const o1 = this.getArgAsNum(0);
    const o2 = this.getArgAsNum(1);
    const name = this.getArgAsName(2);
    if (o2 === 0)
      throw new Error("mod(ModBI) 割る数が0です。");
    const div = o1 / o2;
    const divf = Math.floor(div);
    const mod = o1 - o2*divf;
    this.setVar(name,mod);
  }
}

// 床関数(またはガウス記号．つまり小数切り捨て)
class FloorBI extends BuiltIn {
  constructor() {super("floor");}
  eval() {
    this.checkArgsNum(2);
    const o1 = this.getArgAsNum(0);
    const name = this.getArgAsName(1);
    this.setVar(name,Math.floor(o1));
  }
}

// SneqFunc = SearchFunc + NeqFunc
// sneqはseqのまったく反対ではなくあくまでSearchFunc + NeqFuncなので
// 1つ目の引数がWMになければfalseになる点注意
// まだDoubleとStringの場合にしか対応していない
class SneqBI extends BuiltIn {
  constructor() {super("sneq");}
  eval() {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// プロダクションシステムのループ処理を強制終了させる
class StopBI extends BuiltIn {
  constructor() {super("stop");}
  eval() {
    this.engine.stop();
    console.log("stop(StopBI) 推論エンジンを停止させます。");
  }
}

// ワーキングメモリの内容をコンソールにダンプする
class WmBI extends BuiltIn {
  constructor() {super("wm");}
  eval() {
    const wm = this.engine.dumpWM();
    console.log(wm);
  }
}

// 主にOneTimeモードの時に推論結果を保存して
// おくためのビルトイン。引数は1つに限定。
class ResultBI extends BuiltIn {
  reservedResult = null;
  resolvePromiseFunc = null;
  constructor() {super("result");}
  eval() {
    this.checkArgsNum(1);
    const res = this.getArg(0);
    if (this.resolvePromiseFunc) {
      this.resolvePromiseFunc(res);
      this.resolvePromiseFunc = null;
    } else {
      this.reservedResult = res;
    }
  }
  async getResult(timeout) {
    return new Promise((resolve,reject) => {
      if (this.reservedResult) {
        resolve(this.reservedResult);
        this.reservedResult = null;
      } else {
        this.resolvePromiseFunc = resolve;
      }
      setTimeout(()=>{resolve("Timeout!")},timeout);
    });
  }
}


// このモジュールからExportするのは以下。ただ
// simple-psパッケージからExportするのはEngine
// とBuiltInだけで良いかも。



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BuiltIn: () => (/* reexport safe */ _simple_ps__WEBPACK_IMPORTED_MODULE_0__.BuiltIn),
/* harmony export */   Engine: () => (/* reexport safe */ _simple_ps__WEBPACK_IMPORTED_MODULE_0__.Engine)
/* harmony export */ });
/* harmony import */ var _simple_ps__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./simple-ps */ "./src/simple-ps.js");




})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=simple-ps.js.map