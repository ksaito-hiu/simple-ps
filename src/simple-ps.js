import { parse } from './parser';

// 推論システム
// 推論は常に完全に停止して終了するタイプではなく
// ワーキングメモリの状況に変化があれば自動で
// 推論を再開するようにする。
// ただ、無駄にCPUを消費することが無いように、
// ワーキングメモリに変化が無い時は自動で
// スリープ状態にする。
// 上記を実現する方針は、Java版SimplePSを参考に
// するべし。

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
  // このTermの引数の中に情報名(変数)が
  // あったら、その情報名でWMを検索しupdateTimeを
  // 抽出し、その一番新しい値(最大値)を返す。
  newestTime(engine) {
    let newestTime = 0;
    this.args.forEach((arg)=>{
      if (arg.constructor === "Var") {
        const updateTime = engine.getInfoUpdateTime(arg.name);
        if (newestTime < updateTime)
          newestTime = updateTime;
      }
    });
    return newestTime;
  }
}

class Rule {
  engine; // このルールを読み込んだEngine。後でengine自身ががセット
  priority; // 優先度
  lhs; // 条件部(Left Hand Side)(Termの配列)
  rhs; // 実行部(Right Hand Side)(Termの配列)
  env; // 変数のバインディングを保持する環境
  updateTime; // このルールが最後に実行された時間

  constructor(priority,lhs,rhs) {
    this.priority = priority;
    this.lhs = lhs;
    this.rhs = rhs;
    this.updateTime = -1;
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
    let newestTime = -1;
    for (let i=0;i<this.lhs.length;i++) {
      const term = this.lhs[i];
      const builtIn = this.engine.builtIns[term.name];
      if (builtIn) {
        try {
          if (!builtIn.preEval(term.args,this.env))
            return false;
          const t = term.newestTime(this.engine);
          if (t>newestTime)
            newestTime = t;
        } catch(e) {
          console.log(e);
          return false;
        }
      } else {
        console.log(`${term.name}という名前のビルトインが見付かりません。`)
        return false;
      }
    }
    //前に実行されてから状況が変っていなければ
    //条件があっていても無意味に(?)2度以上実行されるのを防ぐ
    if (newestTime<=this.updateTime)
      return false;
    return true;
  }

  // このルールの実行部を実行
  doActions() {
    this.updateTime = this.engine.timeCounter;
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
  // ワーキングメモリに情報を追加または上書きする
  setInfoToWM(infoName,value) {
    this.engine.setInfoToWM(infoName,value);
  }
  // ワーキングメモリから情報を取り出す
  getInfoFromWM(infoName) {
    return this.engine.getInfoFromWM(infoName);
  }
  // ワーキングメモリから情報を削除
  delInfoFromWM(infoName) {
    this.engine.delInfoFromWM(infoName);
  }
}

// 推論エンジン本体。中にルールなど全部入っている。
class Engine {
  rules; // ルールの配列
  builtIns; // ビルトインのMap
  workingMemory; // ワーキングメモリのMap
  stopRequest; // 推論の終了リクエスト(boolean)
  timeCounter; // ワーキングメモリの変化で進むタイムカウンタ(整数)
  timeoutID; // setTimeoutを止めるために記録(-1の時は推論中)(整数)

  constructor(ruleStr) {
    if (ruleStr === undefined)
      this.rules = [];
    else
      this.rules = parse(ruleStr);
    this.rules.forEach((rule)=>{
      rule.engine = this;
    });
    this.builtIns = {};
    this.workingMemory = {};
    this.stopRequest = true; // setInfoToWM()で勝手に動き出さないように。
    this.timeCounter = 0;
    this.timeoutID = 0; // 0はsetTimeout中でもなく推論中でもない時

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
  }

  // ビルトインを追加
  addBuiltIn(builtIn) {
    builtIn.engine = this;
    this.builtIns[builtIn.name] = builtIn;
  }

  // ワーキングメモリに情報を追加または上書き
  setInfoToWM(infoName,value) {
    if (value === undefined) value = null;
    this.timeCounter++;
    this.workingMemory[infoName] = {updateTime:this.timeCounter,value};
    if (this.stopRequest === false && this.timeoutID === 0)
      this.start();
  }

  // ワーキングメモリから情報を取り出す
  getInfoFromWM(infoName) {
    const info = this.workingMemory[infoName];
    if (!info) return undefined;
    return info.value;
  }

  // ワーキングメモリから情報を消去
  delInfoFromWM(infoName) {
    delete this.workingMemory[infoName];
  }

  // ワーキングメモリから情報の更新時間を取り出す
  getInfoUpdateTime(infoName) {
    const info = this.workingMemory[infoName];
    if (!info) return undefined;
    return info.updateTime;
  }

  // ワーキングメモリの内容を文字列でダンプ
  dumpWM() {
    let str = "";
    Object.keys(this.workingMemory).forEach((key)=>{
      str += key + ":";
      str += this.workingMemory[key].value + " ";
    });
    return str;
  }

  // 推論をスタート
  start() {
    this.stopRequest = false;
    this.timeoutID = setTimeout(()=>{this.inferLoop();},0);
  }

  // 推論のループ。[照合、競合解消、実行]1セット分
  inferLoop() {
    this.timeoutID = -1;
    const conflictSet = [];
    this.rules.forEach((rule)=>{
      if (rule.checkConditions(this.workingMemory))
        conflictSet.push(rule);
    });
    let maxPriority = -1;
    let targetRule = null;
    conflictSet.forEach((rule)=>{
      if (maxPriority<rule.priority) {
        targetRule = rule;
        maxPriority = rule.priority;
      }
    });
    if (targetRule !== null) {
      targetRule.doActions();
    } else {
      this.timeoutID = 0;
      return;
    }
    if (this.stopRequest === false) {
      this.timeoutID = setTimeout(()=>{this.inferLoop();},0);
    } else {
      this.timeoutID = 0;
    }
  }

  // 推論を停止させます
  stop() {
    this.stopRequest = true;
    clearTimeout(this.timeoutID);
    this.timeoutID = 0;
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
    this.setInfoToWM(name,v);
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
    this.setInfoToWM(name,value);
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


// このモジュールからExportするのは以下。ただ
// simple-psパッケージからExportするのはEngine
// とBuiltInだけで良いかも。
export { Engine, Rule, Term, Var, BuiltIn };
