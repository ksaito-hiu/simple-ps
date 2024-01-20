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
          if (!builtIn.eval(term.args,this.env))
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
          builtIn.eval(term.args,this.env);
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

// 処理は全てBuiltInとして実装
class BuiltIn {
  name; // 名前
  engine; // 推論エンジン
  constructor(name,engine) {
    this.name = name;
    this.engine = engine;
  }
  eval(args,env) {
    // 引数のargs配列と、変数と値のMapである環境envを
    // 受け取り必要な処理を行う。
    // このBuiltinを条件部で使うならばtrueかfalseを
    // returnすること。処理によっては例外をthrowする
    // ことができるものとする。
  }
  // 引数の数をチェックしてダメな時は例外を発生
  checkArgsNo(args,n) {
    if (args.length != n)
      throw new Error(`${this.name}(${this.constructor.name}) 必ず${n}の引数を指定して下さい。`);
  }
  // 引数のn番目が変数かどうかチェックしてダメな時は例外を発生
  checkArgNVar(args,n) {
    if (args[n].constructor.name != "Var")
      throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は変数でなければなりません。`);
  }
  // 引数のn番目が数字かどうかチェックしてダメな時は例外を発生
  // 変数の時はその中もチェックして判断
  checkArgNNum(args,n,env) {
    if (typeof args[n] === "number")
      return;
    else if (args[n].constructor.name == "Var") {
      const v = env[args[n].name];
      if (typeof v === "number")
        return;
      else (typeof v === undefined || typeof v === null)
        throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は数値でなければなりません。`);
  }
  // 引数のn番目が文字かどうかチェックしてダメな時は例外を発生
  // 変数の時はその中もチェックして判断
  checkArgNStr(args,n,env) {
    if (typeof args[n] === "string")
      return;
    else if (args[n].constructor.name == "Var") {
      const v = env[args[n].name];
      if (typeof v === "string")
        return;
      else (typeof v === undefined || typeof v === null)
        throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は文字列でなければなりません。`);
  }
  // 引数のn番目が値を持っているかどうかチェックしてダメな時は例外を発生
  // 変数の時はその中もチェックして判断
  checkArgNNoEmpty(args,n,env) {
    if (typeof args[n] === "number")
      return;
    else if (typeof args[n] === "string") {
      return;
    } else if (args[n].constructor.name == "Var") {
      const v = env[args[n].name];
      if (typeof v === "number")
        return;
      else if (typeof v === "string")
        return;
      else (typeof v === undefined || typeof v === null)
        throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数の変数は空でした。`);
    }
    throw new Error(`${this.name}(${this.constructor.name}) ${n+1}番目の引数は文字列でなければなりません。`);
  }
  // n番目の引数から値を取り出すメソッド。変数の時はそれも展開する。
  getValue(args,n,env) {
    if (typeof args[n] === "number")
      return args[n];
    else if (typeof args[n] === "string")
      return args[n];
    else if (args[n].constructor.name === "Var") {
      const v = env[args[n].name];
      return v;
    }
  }
  // ワーキングメモリに情報を追加または上書きする
  setInfoToWM(infoName,value) {
    this.engine.setInfoToWM(infoName,value);
  }
  // ワーキングメモリから情報を取り出す
  getInfoFromWM(infoName) {
    return this.engine.getInfoFromWM(infoName);
  }
}

// 推論エンジン本体。中にルールなど全部入っている。
class Engine {
  rules; // ルールの配列
  builtIns; // ビルトインのMap
  workingMemory; // ワーキングメモリのMap
  stopRequest; // 推論の終了リクエスト(boolean)
  timeCounter; // 推論ステップで進むタイムカウンタ(整数)
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

    this.addBuiltIn(new SearchBI(this));
    this.addBuiltIn(new NoBI(this));
    this.addBuiltIn(new GtBI(this));
    this.addBuiltIn(new LtBI(this));
    this.addBuiltIn(new GeBI(this));
    this.addBuiltIn(new LeBI(this));
    this.addBuiltIn(new EqBI(this));
    this.addBuiltIn(new NeqBI(this));
    this.addBuiltIn(new RangeBI(this));
    this.addBuiltIn(new Range2BI(this));
    this.addBuiltIn(new SeqBI(this));
    this.addBuiltIn(new SgtBI(this));
    this.addBuiltIn(new SltBI(this));
    this.addBuiltIn(new SgeBI(this));
    this.addBuiltIn(new SleBI(this));
    this.addBuiltIn(new SetBI(this));
    this.addBuiltIn(new StoreBI(this));
    this.addBuiltIn(new Store2BI(this));
    this.addBuiltIn(new DelBI(this));
    this.addBuiltIn(new AddBI(this));
    this.addBuiltIn(new SubBI(this));
    this.addBuiltIn(new MulBI(this));
    this.addBuiltIn(new DivBI(this));
    this.addBuiltIn(new ConcatBI(this));
    this.addBuiltIn(new LogBI(this));
    this.addBuiltIn(new RandBI(this));
    this.addBuiltIn(new ModBI(this));
    this.addBuiltIn(new FloorBI(this));
    this.addBuiltIn(new SneqBI(this));
    this.addBuiltIn(new StopBI(this));
  }

  // ビルトインを追加
  addBuiltIn(builtIn) {
    this.builtIns[builtIn.name] = builtIn;
  }

  // ワーキングメモリに情報を追加または上書き
  setInfoToWM(infoName,value) {
    if (value === undefined) value = null;
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
    this.timeCounter++;
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
  constructor(engine) {super("s",engine);}
  eval(args,env) {
    this.checkArgsNo(args,1);
    this.checkArgNVar(args,0);
    const v = this.getInfoFromWM(args[0].name);
    if (v === undefined)
      return false;
    env[args[0].name] = v;
    return true;
  }
}

// 第一引数で指定した情報がワーキングメモリに
// 無い場合にtrue．そうでない場合にfalseを返す．
class NoBI extends BuiltIn {
  constructor(engine) {super("no",engine);}
  eval(args,env) {
    this.checkArgsNo(args,1);
    this.checkArgNVar(args,0);
    const v = this.getInfoFromWM(args[0].name);
    if (v === undefined)
      return true;
    else
      return false;
  }
}

// より大きい(>)の条件判断関数
class GtBI extends BuiltIn {
  constructor(engine) {super("gt",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// より小さい(<)の条件判断関数
class LtBI extends BuiltIn {
  constructor(engine) {super("lt",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 以上(>=)の条件判断関数
class GeBI extends BuiltIn {
  constructor(engine) {super("ge",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 以下(<=)の条件判断関数
class LeBI extends BuiltIn {
  constructor(engine) {super("le",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 等しいかどうかの条件判断関数
class EqBI extends BuiltIn {
  constructor(engine) {super("eq",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 等しくないかどうかの条件判断関数
class NeqBI extends BuiltIn {
  constructor(engine) {super("neq",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 数値が，ある範囲におさまっているかどうかの件判断関数(>,<)
class RangeBI extends BuiltIn {
  constructor(engine) {super("range",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 数値が，ある範囲におさまっているかどうかの件判断関数(=>,<=)
class Range2BI extends BuiltIn {
  constructor(engine) {super("range2",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SeqBI = SearchBI + EqBI
class SeqBI extends BuiltIn {
  constructor(engine) {super("seq",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SgtBI = SearchBI + GtBI
class SgtBI extends BuiltIn {
  constructor(engine) {super("sgt",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SltBI = SearchBI + LtBI
class SltBI extends BuiltIn {
  constructor(engine) {super("slt",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SgeBI = SearchBI + GeBI
class SgeBI extends BuiltIn {
  constructor(engine) {super("sge",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SleBI = SearchBI + LeBI
class SleBI extends BuiltIn {
  constructor(engine) {super("sle",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 変数に値を代入するための関数
class SetBI extends BuiltIn {
  constructor(engine) {super("set",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// ワーキングメモリに情報をセットする関数
// 1つの変数を引数に取り、その変数の名前と値でセット
class StoreBI extends BuiltIn {
  constructor(engine) {super("st",engine);}
  eval(args,env) {
    this.checkArgsNo(args,1);
    this.checkArgNVar(args,0);
    const v = env[args[0].name];
    this.setInfoToWM(args[0].name,v);
    return true;
  }
}

// ワーキングメモリに情報をセットする関数
// 2つの引数に取り、1つ目の名前で2つ目の値をセット
class Store2BI extends BuiltIn {
  constructor(engine) {super("st2",engine);}
  eval(args,env) {
    this.checkArgsNo(args,2);
    this.checkArgNVar(args,0);
    const infoName = args[0].name;
    const value = this.getValue(args,1,env);
    this.setInfoToWM(args[0].name,value);
  }
}

// ワーキングメモリから情報を消す関数
class DelBI extends BuiltIn {
  constructor(engine) {super("del",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 足し算を行う関数
class AddBI extends BuiltIn {
  constructor(engine) {super("add",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 引き算を行う関数
class SubBI extends BuiltIn {
  constructor(engine) {super("sub",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// かけ算を行う関数
class MulBI extends BuiltIn {
  constructor(engine) {super("mul",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 割り算を行う関数
class DivBI extends BuiltIn {
  constructor(engine) {super("div",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 文字列の結合を行う関数
class ConcatBI extends BuiltIn {
  constructor(engine) {super("concat",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 文字列を標準出力に表示する関数
class LogBI extends BuiltIn {
  constructor(engine) {super("log",engine);}
  eval(args,env) {
    let str = '';
    for (let i=0;i<args.length;i++) {
      const v = this.getValue(args,i,env);
      str += v;
    }
    console.log(str);
  }
}

// [0.0-1.0]の乱数を生成する関数
class RandBI extends BuiltIn {
  constructor(engine) {super("rand",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// あまりの計算(mod)
class ModBI extends BuiltIn {
  constructor(engine) {super("mod",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// 床関数(またはガウス記号．つまり小数切り捨て)
class FloorBI extends BuiltIn {
  constructor(engine) {super("floor",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// SneqFunc = SearchFunc + NeqFunc
// sneqはseqのまったく反対ではなくあくまでSearchFunc + NeqFuncなので
// 1つ目の引数がWMになければfalseになる点注意
// まだDoubleとStringの場合にしか対応していない
class SneqBI extends BuiltIn {
  constructor(engine) {super("sneq",engine);}
  eval(args,env) {
    console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`);
  }
}

// プロダクションシステムのループ処理を強制終了させる
class StopBI extends BuiltIn {
  constructor(engine) {super("stop",engine);}
  eval(args,env) {
    this.engine.stop();
  }
}


// このモジュールからExportするのは以下。ただ
// simple-psパッケージからExportするのはEngine
// とBuiltInだけで良いかも。
export { Engine, Rule, Term, Var, BuiltIn };
